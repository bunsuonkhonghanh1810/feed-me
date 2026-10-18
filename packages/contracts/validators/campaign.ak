use aiken/collection/list
use aiken/crypto.{ScriptHash, VerificationKeyHash}
use aiken/interval
use cardano/address.{
  Address, Credential, VerificationKey, from_script, from_verification_key,
}
use cardano/assets
use cardano/transaction.{InlineDatum, Input, NoDatum, Output, OutputReference, Transaction, resolve_input}
use feed_me/math

pub type PosixTime =
  Int

pub type CampaignStatus {
  Active
  Approved
  Disbursed
  Rejected
}

pub type CampaignDatum {
  campaign_id: ByteArray,
  creator: VerificationKeyHash,
  requested_amount: Int,
  deposit_collateral: Int,
  deadline: PosixTime,
  yes_votes_sqrt: Int,
  total_votes_sqrt: Int,
  status: CampaignStatus,
}

pub type CampaignRedeemer {
  CloseAndClaim
  Cancel
  CloseRejected
  UpdateVotes { new_yes_votes_sqrt: Int, new_total_votes_sqrt: Int }
}

fn pays_to_creator(
  outputs: List<Output>,
  creator: VerificationKeyHash,
  min_lovelace: Int,
) -> Bool {
  list.any(
    outputs,
    fn(output) {
      output.address.payment_credential == VerificationKey(creator) && assets.lovelace_of(
        output.value,
      ) >= min_lovelace
    },
  )
}

validator campaign {
  spend(
    datum: Option<CampaignDatum>,
    redeemer: CampaignRedeemer,
    oref: OutputReference,
    tx: Transaction,
  ) {
    expect Some(campaign_datum) = datum

    when redeemer is {
      CloseAndClaim -> {
        // 1. Deadline must be passed
        let deadline_passed =
          interval.is_entirely_after(tx.validity_range, campaign_datum.deadline)?

        // 2. Creator must authorize the close & claim
        let creator_signed =
          list.has(tx.extra_signatories, campaign_datum.creator)?

        // 3. Consensus threshold (>= 75%) must be reached or previously approved
        let consensus_approved =
          (campaign_datum.status == Approved || math.is_consensus_reached(
            campaign_datum.yes_votes_sqrt,
            campaign_datum.total_votes_sqrt,
          ))?

        // 4. Creator's deposit collateral (anti-spam 2 ADA) must be returned
        let collateral_refunded =
          pays_to_creator(
            tx.outputs,
            campaign_datum.creator,
            campaign_datum.deposit_collateral,
          )?

        deadline_passed && creator_signed && consensus_approved && collateral_refunded
      }

      Cancel -> {
        // 1. Can only cancel strictly before the deadline
        let before_deadline =
          interval.is_entirely_before(
            tx.validity_range,
            campaign_datum.deadline,
          )?

        // 2. Can only cancel if campaign is Active
        let is_active = (campaign_datum.status == Active)?

        // 3. Creator must sign
        let creator_signed =
          list.has(tx.extra_signatories, campaign_datum.creator)?

        // 4. Deposit collateral must be refunded to creator
        let collateral_refunded =
          pays_to_creator(
            tx.outputs,
            campaign_datum.creator,
            campaign_datum.deposit_collateral,
          )?

        before_deadline && is_active && creator_signed && collateral_refunded
      }

      CloseRejected -> {
        // 1. Deadline must be passed
        let deadline_passed =
          interval.is_entirely_after(tx.validity_range, campaign_datum.deadline)?

        // 2. Creator must sign to retrieve collateral
        let creator_signed =
          list.has(tx.extra_signatories, campaign_datum.creator)?

        // 3. Consensus was NOT reached (< 75% or 0 votes)
        let not_approved =
          (!math.is_consensus_reached(
            campaign_datum.yes_votes_sqrt,
            campaign_datum.total_votes_sqrt,
          ))?

        // 4. Deposit collateral must be refunded to creator
        let collateral_refunded =
          pays_to_creator(
            tx.outputs,
            campaign_datum.creator,
            campaign_datum.deposit_collateral,
          )?

        deadline_passed && creator_signed && not_approved && collateral_refunded
      }

      UpdateVotes { new_yes_votes_sqrt, new_total_votes_sqrt } -> {
        // 1. Updating votes is only allowed before deadline
        let before_deadline =
          interval.is_entirely_before(
            tx.validity_range,
            campaign_datum.deadline,
          )?

        // 2. Campaign must be Active
        let is_active = (campaign_datum.status == Active)?

        // 3. Creator must authorize the tally update
        let creator_signed =
          list.has(tx.extra_signatories, campaign_datum.creator)?

        // 4. Vote counts must be monotonic and consistent
        let valid_vote_increments =
          new_total_votes_sqrt >= campaign_datum.total_votes_sqrt && new_yes_votes_sqrt >= campaign_datum.yes_votes_sqrt && new_yes_votes_sqrt <= new_total_votes_sqrt

        // 5. Must have continuing output preserving state, collateral, and updated votes
        let own_input = resolve_input(tx.inputs, oref)
        let script_address = own_input.address
        let continuing_outputs =
          list.filter(tx.outputs, fn(o) { o.address == script_address })

        expect [continuation] = continuing_outputs
        expect InlineDatum(raw_datum) = continuation.datum
        expect cont_datum: CampaignDatum = raw_datum

        let state_preserved =
          and {
            cont_datum.campaign_id == campaign_datum.campaign_id,
            cont_datum.creator == campaign_datum.creator,
            cont_datum.requested_amount == campaign_datum.requested_amount,
            cont_datum.deposit_collateral == campaign_datum.deposit_collateral,
            cont_datum.deadline == campaign_datum.deadline,
            cont_datum.status == Active,
            cont_datum.yes_votes_sqrt == new_yes_votes_sqrt,
            cont_datum.total_votes_sqrt == new_total_votes_sqrt,
            assets.lovelace_of(continuation.value) >= campaign_datum.deposit_collateral,
          }

        before_deadline && is_active && creator_signed && valid_vote_increments && state_preserved
      }
    }
  }
}

// =============================================================================
// Unit Tests
// =============================================================================

const mock_creator: VerificationKeyHash =
  #"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

const other_user: VerificationKeyHash =
  #"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"

const mock_script_hash: ScriptHash =
  #"cccccccccccccccccccccccccccccccccccccccccccccccccccccccc"

const mock_campaign_id: ByteArray = #"cafe0001"

const mock_deadline: PosixTime = 1_700_000_000_000

const mock_collateral: Int = 2_000_000

// 2 ADA
const mock_requested: Int = 50_000_000

// 50 ADA

fn mock_oref() -> OutputReference {
  OutputReference {
    transaction_id: #"0000000000000000000000000000000000000000000000000000000000000000",
    output_index: 0,
  }
}

fn sample_campaign_datum(
  yes_votes: Int,
  total_votes: Int,
  status: CampaignStatus,
) -> CampaignDatum {
  CampaignDatum {
    campaign_id: mock_campaign_id,
    creator: mock_creator,
    requested_amount: mock_requested,
    deposit_collateral: mock_collateral,
    deadline: mock_deadline,
    yes_votes_sqrt: yes_votes,
    total_votes_sqrt: total_votes,
    status,
  }
}

fn script_input(datum: CampaignDatum, oref: OutputReference) -> Input {
  Input {
    output_reference: oref,
    output: Output {
      address: from_script(mock_script_hash),
      value: assets.from_lovelace(mock_collateral),
      datum: InlineDatum(datum),
      reference_script: None,
    },
  }
}

fn refund_output(recipient: VerificationKeyHash, amount: Int) -> Output {
  Output {
    address: from_verification_key(recipient),
    value: assets.from_lovelace(amount),
    datum: NoDatum,
    reference_script: None,
  }
}

test close_and_claim_after_deadline_with_75_percent_succeeds() {
  let datum = sample_campaign_datum(75, 100, Active)
  let oref = mock_oref()
  let tx =
    Transaction {
      ..transaction.placeholder,
      extra_signatories: [mock_creator],
      validity_range: interval.after(mock_deadline + 1),
      inputs: [script_input(datum, oref)],
      outputs: [refund_output(mock_creator, mock_collateral)],
    }

  campaign.spend(Some(datum), CloseAndClaim, oref, tx)
}

test close_and_claim_after_deadline_with_80_percent_succeeds() {
  let datum = sample_campaign_datum(80, 100, Active)
  let oref = mock_oref()
  let tx =
    Transaction {
      ..transaction.placeholder,
      extra_signatories: [mock_creator],
      validity_range: interval.after(mock_deadline + 1),
      inputs: [script_input(datum, oref)],
      outputs: [refund_output(mock_creator, mock_collateral)],
    }

  campaign.spend(Some(datum), CloseAndClaim, oref, tx)
}

test close_and_claim_below_75_percent_fails() fail {
  let datum = sample_campaign_datum(74, 100, Active)
  let oref = mock_oref()
  let tx =
    Transaction {
      ..transaction.placeholder,
      extra_signatories: [mock_creator],
      validity_range: interval.after(mock_deadline + 1),
      inputs: [script_input(datum, oref)],
      outputs: [refund_output(mock_creator, mock_collateral)],
    }

  campaign.spend(Some(datum), CloseAndClaim, oref, tx)
}

test close_and_claim_with_zero_votes_fails() fail {
  let datum = sample_campaign_datum(0, 0, Active)
  let oref = mock_oref()
  let tx =
    Transaction {
      ..transaction.placeholder,
      extra_signatories: [mock_creator],
      validity_range: interval.after(mock_deadline + 1),
      inputs: [script_input(datum, oref)],
      outputs: [refund_output(mock_creator, mock_collateral)],
    }

  campaign.spend(Some(datum), CloseAndClaim, oref, tx)
}

test close_and_claim_before_deadline_fails() fail {
  let datum = sample_campaign_datum(80, 100, Active)
  let oref = mock_oref()
  let tx =
    Transaction {
      ..transaction.placeholder,
      extra_signatories: [mock_creator],
      validity_range: interval.before(mock_deadline - 1),
      inputs: [script_input(datum, oref)],
      outputs: [refund_output(mock_creator, mock_collateral)],
    }

  campaign.spend(Some(datum), CloseAndClaim, oref, tx)
}

test close_and_claim_without_creator_signature_fails() fail {
  let datum = sample_campaign_datum(80, 100, Active)
  let oref = mock_oref()
  let tx =
    Transaction {
      ..transaction.placeholder,
      extra_signatories: [other_user],
      validity_range: interval.after(mock_deadline + 1),
      inputs: [script_input(datum, oref)],
      outputs: [refund_output(mock_creator, mock_collateral)],
    }

  campaign.spend(Some(datum), CloseAndClaim, oref, tx)
}

test close_and_claim_without_collateral_refund_fails() fail {
  let datum = sample_campaign_datum(80, 100, Active)
  let oref = mock_oref()
  let tx =
    Transaction {
      ..transaction.placeholder,
      extra_signatories: [mock_creator],
      validity_range: interval.after(mock_deadline + 1),
      inputs: [script_input(datum, oref)],
      outputs: [refund_output(other_user, mock_collateral)],
    }

  campaign.spend(Some(datum), CloseAndClaim, oref, tx)
}

test cancel_before_deadline_succeeds() {
  let datum = sample_campaign_datum(10, 20, Active)
  let oref = mock_oref()
  let tx =
    Transaction {
      ..transaction.placeholder,
      extra_signatories: [mock_creator],
      validity_range: interval.before(mock_deadline - 1),
      inputs: [script_input(datum, oref)],
      outputs: [refund_output(mock_creator, mock_collateral)],
    }

  campaign.spend(Some(datum), Cancel, oref, tx)
}

test cancel_after_deadline_fails() fail {
  let datum = sample_campaign_datum(10, 20, Active)
  let oref = mock_oref()
  let tx =
    Transaction {
      ..transaction.placeholder,
      extra_signatories: [mock_creator],
      validity_range: interval.after(mock_deadline + 1),
      inputs: [script_input(datum, oref)],
      outputs: [refund_output(mock_creator, mock_collateral)],
    }

  campaign.spend(Some(datum), Cancel, oref, tx)
}

test cancel_without_creator_signature_fails() fail {
  let datum = sample_campaign_datum(10, 20, Active)
  let oref = mock_oref()
  let tx =
    Transaction {
      ..transaction.placeholder,
      extra_signatories: [other_user],
      validity_range: interval.before(mock_deadline - 1),
      inputs: [script_input(datum, oref)],
      outputs: [refund_output(mock_creator, mock_collateral)],
    }

  campaign.spend(Some(datum), Cancel, oref, tx)
}

test close_rejected_after_deadline_succeeds() {
  let datum = sample_campaign_datum(50, 100, Active)
  let oref = mock_oref()
  let tx =
    Transaction {
      ..transaction.placeholder,
      extra_signatories: [mock_creator],
      validity_range: interval.after(mock_deadline + 1),
      inputs: [script_input(datum, oref)],
      outputs: [refund_output(mock_creator, mock_collateral)],
    }

  campaign.spend(Some(datum), CloseRejected, oref, tx)
}

test close_rejected_when_approved_fails() fail {
  let datum = sample_campaign_datum(80, 100, Active)
  let oref = mock_oref()
  let tx =
    Transaction {
      ..transaction.placeholder,
      extra_signatories: [mock_creator],
      validity_range: interval.after(mock_deadline + 1),
      inputs: [script_input(datum, oref)],
      outputs: [refund_output(mock_creator, mock_collateral)],
    }

  campaign.spend(Some(datum), CloseRejected, oref, tx)
}

test update_votes_before_deadline_succeeds() {
  let datum = sample_campaign_datum(0, 0, Active)
  let oref = mock_oref()
  let updated_datum = sample_campaign_datum(15, 20, Active)
  let continuing_output =
    Output {
      address: from_script(mock_script_hash),
      value: assets.from_lovelace(mock_collateral),
      datum: InlineDatum(updated_datum),
      reference_script: None,
    }

  let tx =
    Transaction {
      ..transaction.placeholder,
      extra_signatories: [mock_creator],
      validity_range: interval.before(mock_deadline - 1),
      inputs: [script_input(datum, oref)],
      outputs: [continuing_output],
    }

  campaign.spend(
    Some(datum),
    UpdateVotes { new_yes_votes_sqrt: 15, new_total_votes_sqrt: 20 },
    oref,
    tx,
  )
}

test update_votes_after_deadline_fails() fail {
  let datum = sample_campaign_datum(0, 0, Active)
  let oref = mock_oref()
  let updated_datum = sample_campaign_datum(15, 20, Active)
  let continuing_output =
    Output {
      address: from_script(mock_script_hash),
      value: assets.from_lovelace(mock_collateral),
      datum: InlineDatum(updated_datum),
      reference_script: None,
    }

  let tx =
    Transaction {
      ..transaction.placeholder,
      extra_signatories: [mock_creator],
      validity_range: interval.after(mock_deadline + 1),
      inputs: [script_input(datum, oref)],
      outputs: [continuing_output],
    }

  campaign.spend(
    Some(datum),
    UpdateVotes { new_yes_votes_sqrt: 15, new_total_votes_sqrt: 20 },
    oref,
    tx,
  )
}

test update_votes_decreasing_fails() fail {
  let datum = sample_campaign_datum(10, 20, Active)
  let oref = mock_oref()
  let updated_datum = sample_campaign_datum(5, 20, Active)
  let continuing_output =
    Output {
      address: from_script(mock_script_hash),
      value: assets.from_lovelace(mock_collateral),
      datum: InlineDatum(updated_datum),
      reference_script: None,
    }

  let tx =
    Transaction {
      ..transaction.placeholder,
      extra_signatories: [mock_creator],
      validity_range: interval.before(mock_deadline - 1),
      inputs: [script_input(datum, oref)],
      outputs: [continuing_output],
    }

  campaign.spend(
    Some(datum),
    UpdateVotes { new_yes_votes_sqrt: 5, new_total_votes_sqrt: 20 },
    oref,
    tx,
  )
}



