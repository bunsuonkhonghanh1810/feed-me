use aiken/collection/list
use aiken/crypto.{ScriptHash, VerificationKeyHash}
use cardano/address.{Address, Credential, Script, VerificationKey, from_script, from_verification_key}
use cardano/assets.{PolicyId}
use cardano/transaction.{InlineDatum, Input, NoDatum, Output, OutputReference, Transaction, resolve_input}

pub type PosixTime =
  Int

pub const feed_token_name: ByteArray = "FEED"

pub type TreasuryDatum {
  total_staked: Int,
  epoch_counter: Int,
  last_yield_distribution: PosixTime,
  authorized_campaign_script: ScriptHash,
}

pub type TreasuryRedeemer {
  Deposit { amount: Int }
  Unstake { amount: Int }
  Disburse {
    campaign_id: ByteArray,
    target_recipient: VerificationKeyHash,
    amount: Int,
  }
}

fn pays_to_recipient(
  outputs: List<Output>,
  recipient: VerificationKeyHash,
  min_lovelace: Int,
) -> Bool {
  list.any(
    outputs,
    fn(output) {
      output.address.payment_credential == VerificationKey(recipient) && assets.lovelace_of(
        output.value,
      ) >= min_lovelace
    },
  )
}

fn has_script_input(inputs: List<Input>, script_hash: ScriptHash) -> Bool {
  list.any(
    inputs,
    fn(input) {
      when input.output.address.payment_credential is {
        Script(hash) -> hash == script_hash
        _ -> False
      }
    },
  )
}

validator treasury {
  spend(
    datum: Option<TreasuryDatum>,
    redeemer: TreasuryRedeemer,
    oref: OutputReference,
    tx: Transaction,
  ) {
    expect Some(treasury_datum) = datum

    // 1. Resolve own input and script address
    let own_input = resolve_input(tx.inputs, oref)
    let script_address = own_input.address
    let own_lovelace = assets.lovelace_of(own_input.value)

    // 2. Resolve single continuing output to treasury script address
    let continuing_outputs =
      list.filter(tx.outputs, fn(o) { o.address == script_address })
    expect [continuation] = continuing_outputs
    expect InlineDatum(raw_datum) = continuation.datum
    expect next_datum: TreasuryDatum = raw_datum
    let next_lovelace = assets.lovelace_of(continuation.value)

    // Common invariant: authorized_campaign_script must not change
    let campaign_script_preserved =
      (next_datum.authorized_campaign_script == treasury_datum.authorized_campaign_script)?

    when redeemer is {
      Deposit { amount } -> {
        // 1. Deposit amount must be positive
        let valid_amount = (amount > 0)?

        // 2. Staked amount increases by exactly deposit amount
        let stake_updated =
          (next_datum.total_staked == treasury_datum.total_staked + amount)?

        // 3. Lovelace in treasury increases by at least deposit amount
        let lovelace_deposited = (next_lovelace >= own_lovelace + amount)?

        // 4. Epoch state preserved
        let epoch_preserved =
          next_datum.epoch_counter == treasury_datum.epoch_counter && next_datum.last_yield_distribution == treasury_datum.last_yield_distribution

        valid_amount && stake_updated && lovelace_deposited && epoch_preserved && campaign_script_preserved
      }

      Unstake { amount } -> {
        // 1. Unstake amount must be positive and not exceed total staked
        let valid_amount =
          (amount > 0 && amount <= treasury_datum.total_staked)?

        // 2. Staked amount decreases by unstake amount
        let stake_updated =
          (next_datum.total_staked == treasury_datum.total_staked - amount)?

        // 3. Treasury maintains remaining funds
        let lovelace_maintained = (next_lovelace >= own_lovelace - amount)?

        // 4. Epoch state preserved
        let epoch_preserved =
          next_datum.epoch_counter == treasury_datum.epoch_counter && next_datum.last_yield_distribution == treasury_datum.last_yield_distribution

        valid_amount && stake_updated && lovelace_maintained && epoch_preserved && campaign_script_preserved
      }

      Disburse { target_recipient, amount, .. } -> {
        // 1. Disburse amount must be positive and available
        let valid_amount =
          (amount > 0 && amount <= treasury_datum.total_staked)?

        // 2. Payout output must transfer requested amount directly to target recipient
        let recipient_paid =
          pays_to_recipient(tx.outputs, target_recipient, amount)?

        // 3. Must be authenticated by campaign script input (spending or reference input)
        let campaign_authenticated =
          (has_script_input(
            tx.inputs,
            treasury_datum.authorized_campaign_script,
          ) || has_script_input(
            tx.reference_inputs,
            treasury_datum.authorized_campaign_script,
          ))?

        // 4. Staked accounting updated
        let stake_updated =
          (next_datum.total_staked == treasury_datum.total_staked - amount)?

        // 5. Remaining treasury lovelace preserved
        let lovelace_maintained = (next_lovelace >= own_lovelace - amount)?

        let epoch_preserved =
          next_datum.epoch_counter == treasury_datum.epoch_counter && next_datum.last_yield_distribution == treasury_datum.last_yield_distribution

        valid_amount && recipient_paid && campaign_authenticated && stake_updated && lovelace_maintained && epoch_preserved && campaign_script_preserved
      }
    }
  }

  mint(redeemer: TreasuryRedeemer, policy_id: PolicyId, tx: Transaction) {
    let has_treasury = has_script_input(tx.inputs, policy_id)?

    when redeemer is {
      Deposit { amount } -> {
        let is_minted =
          (assets.quantity_of(tx.mint, policy_id, feed_token_name) == amount)?
        amount > 0 && is_minted && has_treasury
      }

      Unstake { amount } -> {
        let is_burned =
          (assets.quantity_of(tx.mint, policy_id, feed_token_name) == -amount)?
        amount > 0 && is_burned && has_treasury
      }

      Disburse { .. } ->
        // No minting or burning during micro-grant disbursement
        assets.quantity_of(tx.mint, policy_id, feed_token_name) == 0
    }
  }
}

// =============================================================================
// Unit Tests
// =============================================================================

const mock_treasury_script_hash: ScriptHash =
  #"11111111111111111111111111111111111111111111111111111111"

const mock_campaign_script_hash: ScriptHash =
  #"22222222222222222222222222222222222222222222222222222222"

const mock_recipient: VerificationKeyHash =
  #"33333333333333333333333333333333333333333333333333333333"

const other_recipient: VerificationKeyHash =
  #"44444444444444444444444444444444444444444444444444444444"

fn mock_oref() -> OutputReference {
  OutputReference {
    transaction_id: #"0000000000000000000000000000000000000000000000000000000000000000",
    output_index: 0,
  }
}

fn sample_treasury_datum(staked: Int) -> TreasuryDatum {
  TreasuryDatum {
    total_staked: staked,
    epoch_counter: 10,
    last_yield_distribution: 1_700_000_000_000,
    authorized_campaign_script: mock_campaign_script_hash,
  }
}

fn treasury_input(staked: Int, lovelace: Int, oref: OutputReference) -> Input {
  Input {
    output_reference: oref,
    output: Output {
      address: from_script(mock_treasury_script_hash),
      value: assets.from_lovelace(lovelace),
      datum: InlineDatum(sample_treasury_datum(staked)),
      reference_script: None,
    },
  }
}

fn treasury_continuing_output(staked: Int, lovelace: Int) -> Output {
  Output {
    address: from_script(mock_treasury_script_hash),
    value: assets.from_lovelace(lovelace),
    datum: InlineDatum(sample_treasury_datum(staked)),
    reference_script: None,
  }
}

fn campaign_witness_input() -> Input {
  Input {
    output_reference: OutputReference {
      transaction_id: #"1111111111111111111111111111111111111111111111111111111111111111",
      output_index: 0,
    },
    output: Output {
      address: from_script(mock_campaign_script_hash),
      value: assets.from_lovelace(2_000_000),
      datum: NoDatum,
      reference_script: None,
    },
  }
}

fn recipient_output(recipient: VerificationKeyHash, amount: Int) -> Output {
  Output {
    address: from_verification_key(recipient),
    value: assets.from_lovelace(amount),
    datum: NoDatum,
    reference_script: None,
  }
}

test deposit_succeeds() {
  let oref = mock_oref()
  let datum = sample_treasury_datum(1_000_000_000)
  // 1000 ADA
  let deposit_amount = 100_000_000

  // 100 ADA
  let tx =
    Transaction {
      ..transaction.placeholder,
      inputs: [treasury_input(1_000_000_000, 1_000_000_000, oref)],
      outputs: [
        treasury_continuing_output(1_100_000_000, 1_100_000_000),
      ],
      mint: assets.from_asset(
        mock_treasury_script_hash,
        feed_token_name,
        deposit_amount,
      ),
    }

  treasury.spend(Some(datum), Deposit { amount: deposit_amount }, oref, tx)
}

test deposit_insufficient_lovelace_fails() fail {
  let oref = mock_oref()
  let datum = sample_treasury_datum(1_000_000_000)
  let deposit_amount = 100_000_000
  let tx =
    Transaction {
      ..transaction.placeholder,
      inputs: [treasury_input(1_000_000_000, 1_000_000_000, oref)],
      // Outputs only 1050 ADA instead of 1100 ADA
      outputs: [
        treasury_continuing_output(1_100_000_000, 1_050_000_000),
      ],
    }

  treasury.spend(Some(datum), Deposit { amount: deposit_amount }, oref, tx)
}

test deposit_zero_amount_fails() fail {
  let oref = mock_oref()
  let datum = sample_treasury_datum(1_000_000_000)
  let tx =
    Transaction {
      ..transaction.placeholder,
      inputs: [treasury_input(1_000_000_000, 1_000_000_000, oref)],
      outputs: [treasury_continuing_output(1_000_000_000, 1_000_000_000)],
    }

  treasury.spend(Some(datum), Deposit { amount: 0 }, oref, tx)
}

test unstake_succeeds() {
  let oref = mock_oref()
  let datum = sample_treasury_datum(1_000_000_000)
  let unstake_amount = 100_000_000
  let tx =
    Transaction {
      ..transaction.placeholder,
      inputs: [treasury_input(1_000_000_000, 1_000_000_000, oref)],
      outputs: [
        treasury_continuing_output(900_000_000, 900_000_000),
        recipient_output(mock_recipient, unstake_amount),
      ],
      mint: assets.from_asset(
        mock_treasury_script_hash,
        feed_token_name,
        -unstake_amount,
      ),
    }

  treasury.spend(Some(datum), Unstake { amount: unstake_amount }, oref, tx)
}

test unstake_exceeding_total_staked_fails() fail {
  let oref = mock_oref()
  let datum = sample_treasury_datum(1_000_000_000)
  let unstake_amount = 1_500_000_000
  let tx =
    Transaction {
      ..transaction.placeholder,
      inputs: [treasury_input(1_000_000_000, 1_000_000_000, oref)],
      outputs: [treasury_continuing_output(0, 0)],
    }

  treasury.spend(Some(datum), Unstake { amount: unstake_amount }, oref, tx)
}

test disburse_with_campaign_input_succeeds() {
  let oref = mock_oref()
  let datum = sample_treasury_datum(1_000_000_000)
  let disburse_amount = 50_000_000

  // 50 ADA
  let tx =
    Transaction {
      ..transaction.placeholder,
      inputs: [
        treasury_input(1_000_000_000, 1_000_000_000, oref),
        campaign_witness_input(),
      ],
      outputs: [
        treasury_continuing_output(950_000_000, 950_000_000),
        recipient_output(mock_recipient, disburse_amount),
      ],
    }

  treasury.spend(
    Some(datum),
    Disburse {
      campaign_id: #"cafe0001",
      target_recipient: mock_recipient,
      amount: disburse_amount,
    },
    oref,
    tx,
  )
}

test disburse_with_campaign_reference_input_succeeds() {
  let oref = mock_oref()
  let datum = sample_treasury_datum(1_000_000_000)
  let disburse_amount = 50_000_000
  let tx =
    Transaction {
      ..transaction.placeholder,
      inputs: [treasury_input(1_000_000_000, 1_000_000_000, oref)],
      reference_inputs: [campaign_witness_input()],
      outputs: [
        treasury_continuing_output(950_000_000, 950_000_000),
        recipient_output(mock_recipient, disburse_amount),
      ],
    }

  treasury.spend(
    Some(datum),
    Disburse {
      campaign_id: #"cafe0001",
      target_recipient: mock_recipient,
      amount: disburse_amount,
    },
    oref,
    tx,
  )
}

test disburse_without_campaign_witness_fails() fail {
  let oref = mock_oref()
  let datum = sample_treasury_datum(1_000_000_000)
  let disburse_amount = 50_000_000
  let tx =
    Transaction {
      ..transaction.placeholder,
      inputs: [treasury_input(1_000_000_000, 1_000_000_000, oref)],
      // No campaign input or reference input
      outputs: [
        treasury_continuing_output(950_000_000, 950_000_000),
        recipient_output(mock_recipient, disburse_amount),
      ],
    }

  treasury.spend(
    Some(datum),
    Disburse {
      campaign_id: #"cafe0001",
      target_recipient: mock_recipient,
      amount: disburse_amount,
    },
    oref,
    tx,
  )
}

test disburse_without_recipient_payout_fails() fail {
  let oref = mock_oref()
  let datum = sample_treasury_datum(1_000_000_000)
  let disburse_amount = 50_000_000
  let tx =
    Transaction {
      ..transaction.placeholder,
      inputs: [
        treasury_input(1_000_000_000, 1_000_000_000, oref),
        campaign_witness_input(),
      ],
      // Output pays other_recipient instead of mock_recipient
      outputs: [
        treasury_continuing_output(950_000_000, 950_000_000),
        recipient_output(other_recipient, disburse_amount),
      ],
    }

  treasury.spend(
    Some(datum),
    Disburse {
      campaign_id: #"cafe0001",
      target_recipient: mock_recipient,
      amount: disburse_amount,
    },
    oref,
    tx,
  )
}

test mint_deposit_succeeds() {
  let oref = mock_oref()
  let deposit_amount = 100_000_000
  let tx =
    Transaction {
      ..transaction.placeholder,
      inputs: [treasury_input(1_000_000_000, 1_000_000_000, oref)],
      mint: assets.from_asset(
        mock_treasury_script_hash,
        feed_token_name,
        deposit_amount,
      ),
    }

  treasury.mint(
    Deposit { amount: deposit_amount },
    mock_treasury_script_hash,
    tx,
  )
}

test mint_unstake_succeeds() {
  let oref = mock_oref()
  let unstake_amount = 100_000_000
  let tx =
    Transaction {
      ..transaction.placeholder,
      inputs: [treasury_input(1_000_000_000, 1_000_000_000, oref)],
      mint: assets.from_asset(
        mock_treasury_script_hash,
        feed_token_name,
        -unstake_amount,
      ),
    }

  treasury.mint(
    Unstake { amount: unstake_amount },
    mock_treasury_script_hash,
    tx,
  )
}

test mint_disburse_ensures_zero_mint_succeeds() {
  let tx =
    Transaction {
      ..transaction.placeholder,
      mint: assets.zero,
    }

  treasury.mint(
    Disburse {
      campaign_id: #"cafe0001",
      target_recipient: mock_recipient,
      amount: 50_000_000,
    },
    mock_treasury_script_hash,
    tx,
  )
}
