import { MeshTxBuilder, UTxO } from "@meshsdk/core";
import {
  FEED_TOKEN_NAME_HEX,
  toVoteTicketDatum,
  VoteTicketDatum,
  VoteTicketRedeemer,
} from "./types.js";
import { FeedMeContracts } from "./parser.js";

export interface LockVoteTicketParams {
  voterAddress: string;
  voterKeyHash: string;
  utxos: UTxO[];
  collateralUtxo?: UTxO;
  campaignIdHex: string;
  feedAmount: number;
  voteType: boolean;
  expiryPosixTime: number;
  minAdaLovelace?: number;
}

export interface ReclaimVoteTicketParams {
  voterAddress: string;
  voterKeyHash: string;
  utxos: UTxO[];
  collateralUtxo?: UTxO;
  ticketUtxo: UTxO;
  ticketDatum: VoteTicketDatum;
}

export function calculateVotePower(feedAmount: number): number {
  if (feedAmount <= 0) return 0;
  return Math.floor(Math.sqrt(feedAmount));
}

export function buildLockVoteTicketTx(
  txBuilder: MeshTxBuilder,
  contracts: FeedMeContracts,
  params: LockVoteTicketParams,
) {
  const {
    voterAddress,
    voterKeyHash,
    utxos,
    collateralUtxo,
    campaignIdHex,
    feedAmount,
    voteType,
    expiryPosixTime,
    minAdaLovelace = 2_000_000,
  } = params;

  const votePower = calculateVotePower(feedAmount);

  const datum: VoteTicketDatum = {
    voter: voterKeyHash,
    campaign_id: campaignIdHex,
    locked_feed_tokens: feedAmount,
    vote_power: votePower,
    vote_type: voteType,
    expiry: expiryPosixTime,
  };

  // 1. Output locked at VoteTicket contract with locked $FEED tokens + min ADA
  txBuilder
    .txOut(contracts.voteTicket.address, [
      { unit: "lovelace", quantity: minAdaLovelace.toString() },
      {
        unit: contracts.feedPolicyId + FEED_TOKEN_NAME_HEX,
        quantity: feedAmount.toString(),
      },
    ])
    .txOutInlineDatumValue(toVoteTicketDatum(datum), "JSON");

  if (collateralUtxo) {
    txBuilder.txInCollateral(
      collateralUtxo.input.txHash,
      collateralUtxo.input.outputIndex,
      collateralUtxo.output.amount,
      collateralUtxo.output.address,
    );
  }

  txBuilder.changeAddress(voterAddress).selectUtxosFrom(utxos);

  return txBuilder;
}

export function buildReclaimVoteTicketTx(
  txBuilder: MeshTxBuilder,
  contracts: FeedMeContracts,
  params: ReclaimVoteTicketParams,
) {
  const {
    voterAddress,
    voterKeyHash,
    utxos,
    collateralUtxo,
    ticketUtxo,
    ticketDatum,
  } = params;

  // 1. Spend vote ticket UTxO with ReclaimTicket
  txBuilder
    .spendingPlutusScriptV3()
    .txIn(
      ticketUtxo.input.txHash,
      ticketUtxo.input.outputIndex,
      ticketUtxo.output.amount,
      contracts.voteTicket.address,
    )
    .txInScript(contracts.voteTicket.compiledCode)
    .txInInlineDatumPresent()
    .txInRedeemerValue(VoteTicketRedeemer.reclaimTicket());

  // 2. Must be strictly after expiry
  txBuilder.invalidBefore(ticketDatum.expiry + 1);

  // 3. Voter must sign
  txBuilder.requiredSignerHash(voterKeyHash);

  // 4. Return tokens to voter
  txBuilder.txOut(voterAddress, ticketUtxo.output.amount);

  if (collateralUtxo) {
    txBuilder.txInCollateral(
      collateralUtxo.input.txHash,
      collateralUtxo.input.outputIndex,
      collateralUtxo.output.amount,
      collateralUtxo.output.address,
    );
  }

  txBuilder.changeAddress(voterAddress).selectUtxosFrom(utxos);

  return txBuilder;
}
