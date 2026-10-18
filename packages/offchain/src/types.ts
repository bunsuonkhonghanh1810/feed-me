import {
  conStr,
  conStr0,
  conStr1,
  conStr2,
  conStr3,
  integer,
  byteString,
  mConStr0,
  mConStr1,
  mConStr2,
} from "@meshsdk/core";

export const FEED_TOKEN_NAME = "FEED";
export const FEED_TOKEN_NAME_HEX = Buffer.from(FEED_TOKEN_NAME, "utf8").toString("hex");

// Anti-spam collateral for campaigns: 2 ADA (2,000,000 lovelace)
export const DEFAULT_CAMPAIGN_COLLATERAL = 2_000_000;

export interface TreasuryDatum {
  total_staked: number;
  epoch_counter: number;
  last_yield_distribution: number;
  authorized_campaign_script: string;
}

export function toTreasuryDatum(datum: TreasuryDatum) {
  return conStr0([
    integer(datum.total_staked),
    integer(datum.epoch_counter),
    integer(datum.last_yield_distribution),
    byteString(datum.authorized_campaign_script),
  ]);
}

export const TreasuryRedeemer = {
  deposit: (amount: number) => conStr0([integer(amount)]),
  unstake: (amount: number) => conStr1([integer(amount)]),
  disburse: (campaignIdHex: string, targetRecipientPkh: string, amount: number) =>
    conStr2([
      byteString(campaignIdHex),
      byteString(targetRecipientPkh),
      integer(amount),
    ]),
};

export enum CampaignStatus {
  Active = 0,
  Approved = 1,
  Disbursed = 2,
  Rejected = 3,
}

export interface CampaignDatum {
  campaign_id: string;
  creator: string;
  requested_amount: number;
  deposit_collateral: number;
  deadline: number;
  yes_votes_sqrt: number;
  total_votes_sqrt: number;
  status: CampaignStatus;
}

export function toCampaignDatum(datum: CampaignDatum) {
  const statusConstr = conStr(datum.status, []);
  return conStr0([
    byteString(datum.campaign_id),
    byteString(datum.creator),
    integer(datum.requested_amount),
    integer(datum.deposit_collateral),
    integer(datum.deadline),
    integer(datum.yes_votes_sqrt),
    integer(datum.total_votes_sqrt),
    statusConstr,
  ]);
}

export const CampaignRedeemer = {
  closeAndClaim: () => mConStr0([]),
  cancel: () => mConStr1([]),
  closeRejected: () => mConStr2([]),
  updateVotes: (newYesVotesSqrt: number, newTotalVotesSqrt: number) =>
    conStr3([integer(newYesVotesSqrt), integer(newTotalVotesSqrt)]),
};

export interface VoteTicketDatum {
  voter: string;
  campaign_id: string;
  locked_feed_tokens: number;
  vote_power: number;
  vote_type: boolean;
  expiry: number;
}

export function toVoteTicketDatum(datum: VoteTicketDatum) {
  const boolConstr = datum.vote_type ? conStr1([]) : conStr0([]);
  return conStr0([
    byteString(datum.voter),
    byteString(datum.campaign_id),
    integer(datum.locked_feed_tokens),
    integer(datum.vote_power),
    boolConstr,
    integer(datum.expiry),
  ]);
}

export const VoteTicketRedeemer = {
  reclaimTicket: () => mConStr0([]),
};
