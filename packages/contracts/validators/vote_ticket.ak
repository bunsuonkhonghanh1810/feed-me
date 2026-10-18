use aiken/collection/list
use aiken/interval
use aiken/crypto.{VerificationKeyHash}
use cardano/transaction.{OutputReference, Transaction}
use feed_me/math

pub type PosixTime =
  Int

pub type VoteTicketDatum {
  voter: VerificationKeyHash,
  campaign_id: ByteArray,
  locked_feed_tokens: Int,
  vote_power: Int,
  vote_type: Bool,
  expiry: PosixTime,
}

pub type VoteTicketRedeemer {
  ReclaimTicket
}

validator vote_ticket {
  spend(
    datum: Option<VoteTicketDatum>,
    redeemer: VoteTicketRedeemer,
    _oref: OutputReference,
    tx: Transaction,
  ) {
    expect Some(ticket) = datum

    when redeemer is {
      ReclaimTicket -> {
        // 1. Transaction must be signed by the voter who locked the tokens
        let is_voter_signed = list.has(tx.extra_signatories, ticket.voter)?

        // 2. Voting period for this campaign must be over
        let is_expired =
          interval.is_entirely_after(tx.validity_range, ticket.expiry)?

        is_voter_signed && is_expired
      }
    }
  }
}

// =============================================================================
// Tests
// =============================================================================

const mock_voter: VerificationKeyHash =
  #"0123456789abcdef0123456789abcdef0123456789abcdef01234567"

const other_signer: VerificationKeyHash =
  #"fedcba9876543210fedcba9876543210fedcba9876543210fedcba98"

const mock_campaign_id: ByteArray = #"cafebabe0001"

const mock_expiry: PosixTime = 1_700_000_000_000

fn mock_oref() -> OutputReference {
  OutputReference {
    transaction_id: #"0000000000000000000000000000000000000000000000000000000000000000",
    output_index: 0,
  }
}

fn sample_ticket(vote_type: Bool, locked_tokens: Int) -> VoteTicketDatum {
  VoteTicketDatum {
    voter: mock_voter,
    campaign_id: mock_campaign_id,
    locked_feed_tokens: locked_tokens,
    vote_power: math.isqrt(locked_tokens),
    vote_type,
    expiry: mock_expiry,
  }
}

test reclaim_after_expiry_succeeds() {
  let ticket = sample_ticket(True, 100)
  let tx =
    Transaction {
      ..transaction.placeholder,
      extra_signatories: [mock_voter],
      validity_range: interval.after(mock_expiry + 1),
    }

  vote_ticket.spend(Some(ticket), ReclaimTicket, mock_oref(), tx)
}

test reclaim_before_expiry_fails() fail {
  let ticket = sample_ticket(True, 100)
  let tx =
    Transaction {
      ..transaction.placeholder,
      extra_signatories: [mock_voter],
      validity_range: interval.before(mock_expiry - 1),
    }

  vote_ticket.spend(Some(ticket), ReclaimTicket, mock_oref(), tx)
}

test reclaim_at_exact_expiry_fails() fail {
  let ticket = sample_ticket(True, 100)
  // interval.after(mock_expiry) has lower bound == mock_expiry, which is not strictly after mock_expiry
  let tx =
    Transaction {
      ..transaction.placeholder,
      extra_signatories: [mock_voter],
      validity_range: interval.after(mock_expiry),
    }

  vote_ticket.spend(Some(ticket), ReclaimTicket, mock_oref(), tx)
}

test reclaim_without_voter_signature_fails() fail {
  let ticket = sample_ticket(True, 100)
  let tx =
    Transaction {
      ..transaction.placeholder,
      extra_signatories: [],
      validity_range: interval.after(mock_expiry + 1),
    }

  vote_ticket.spend(Some(ticket), ReclaimTicket, mock_oref(), tx)
}

test reclaim_with_wrong_voter_signature_fails() fail {
  let ticket = sample_ticket(True, 100)
  let tx =
    Transaction {
      ..transaction.placeholder,
      extra_signatories: [other_signer],
      validity_range: interval.after(mock_expiry + 1),
    }

  vote_ticket.spend(Some(ticket), ReclaimTicket, mock_oref(), tx)
}

test reclaim_without_datum_fails() fail {
  let tx =
    Transaction {
      ..transaction.placeholder,
      extra_signatories: [mock_voter],
      validity_range: interval.after(mock_expiry + 1),
    }

  vote_ticket.spend(None, ReclaimTicket, mock_oref(), tx)
}

test reclaim_no_vote_after_expiry_succeeds() {
  let ticket = sample_ticket(False, 49)
  let tx =
    Transaction {
      ..transaction.placeholder,
      extra_signatories: [mock_voter],
      validity_range: interval.after(mock_expiry + 10_000),
    }

  vote_ticket.spend(Some(ticket), ReclaimTicket, mock_oref(), tx)
}

test quadratic_voting_power_calculation() {
  let t1 = sample_ticket(True, 100)
  let t2 = sample_ticket(False, 49)
  let t3 = sample_ticket(True, 1)
  let t4 = sample_ticket(True, 10_000)

  and {
    t1.vote_power == 10,
    t2.vote_power == 7,
    t3.vote_power == 1,
    t4.vote_power == 100,
  }
}
