import { MeshTxBuilder, UTxO } from "@meshsdk/core";
import {
  CampaignDatum,
  CampaignRedeemer,
  CampaignStatus,
  DEFAULT_CAMPAIGN_COLLATERAL,
  toCampaignDatum,
} from "./types.js";
import { FeedMeContracts } from "./parser.js";

export interface CreateCampaignParams {
  creatorAddress: string;
  creatorKeyHash: string;
  utxos: UTxO[];
  collateralUtxo?: UTxO;
  campaignIdHex: string;
  requestedLovelace: number;
  deadlinePosixTime: number;
  collateralLovelace?: number;
  metadata?: Record<string, unknown>;
}

export interface CloseCampaignParams {
  creatorAddress: string;
  creatorKeyHash: string;
  utxos: UTxO[];
  collateralUtxo?: UTxO;
  campaignUtxo: UTxO;
  campaignDatum: CampaignDatum;
  currentPosixTime?: number;
}

export function buildCreateCampaignTx(
  txBuilder: MeshTxBuilder,
  contracts: FeedMeContracts,
  params: CreateCampaignParams,
) {
  const {
    creatorAddress,
    creatorKeyHash,
    utxos,
    collateralUtxo,
    campaignIdHex,
    requestedLovelace,
    deadlinePosixTime,
    collateralLovelace = DEFAULT_CAMPAIGN_COLLATERAL,
    metadata,
  } = params;

  const datum: CampaignDatum = {
    campaign_id: campaignIdHex,
    creator: creatorKeyHash,
    requested_amount: requestedLovelace,
    deposit_collateral: collateralLovelace,
    deadline: deadlinePosixTime,
    yes_votes_sqrt: 0,
    total_votes_sqrt: 0,
    status: CampaignStatus.Active,
  };

  // 1. Output creating campaign UTxO locked at campaign validator
  txBuilder
    .txOut(contracts.campaign.address, [
      { unit: "lovelace", quantity: collateralLovelace.toString() },
    ])
    .txOutInlineDatumValue(toCampaignDatum(datum), "JSON");

  // 2. Attach metadata if provided (e.g. food items, reason, student ID hash)
  if (metadata) {
    txBuilder.metadataValue("674", metadata);
  }

  if (collateralUtxo) {
    txBuilder.txInCollateral(
      collateralUtxo.input.txHash,
      collateralUtxo.input.outputIndex,
      collateralUtxo.output.amount,
      collateralUtxo.output.address,
    );
  }

  txBuilder.changeAddress(creatorAddress).selectUtxosFrom(utxos);

  return txBuilder;
}

export function buildCloseAndClaimCampaignTx(
  txBuilder: MeshTxBuilder,
  contracts: FeedMeContracts,
  params: CloseCampaignParams,
) {
  const {
    creatorAddress,
    creatorKeyHash,
    utxos,
    collateralUtxo,
    campaignUtxo,
    campaignDatum,
  } = params;

  // 1. Spend campaign UTxO with CloseAndClaim
  txBuilder
    .spendingPlutusScriptV3()
    .txIn(
      campaignUtxo.input.txHash,
      campaignUtxo.input.outputIndex,
      campaignUtxo.output.amount,
      contracts.campaign.address,
    )
    .txInScript(contracts.campaign.compiledCode)
    .txInInlineDatumPresent()
    .txInRedeemerValue(CampaignRedeemer.closeAndClaim());

  // 2. Must be after deadline
  txBuilder.invalidBefore(campaignDatum.deadline + 1);

  // 3. Creator signature
  txBuilder.requiredSignerHash(creatorKeyHash);

  // 4. Return deposit collateral to creator
  txBuilder.txOut(creatorAddress, [
    { unit: "lovelace", quantity: campaignDatum.deposit_collateral.toString() },
  ]);

  if (collateralUtxo) {
    txBuilder.txInCollateral(
      collateralUtxo.input.txHash,
      collateralUtxo.input.outputIndex,
      collateralUtxo.output.amount,
      collateralUtxo.output.address,
    );
  }

  txBuilder.changeAddress(creatorAddress).selectUtxosFrom(utxos);

  return txBuilder;
}

export function buildCancelCampaignTx(
  txBuilder: MeshTxBuilder,
  contracts: FeedMeContracts,
  params: CloseCampaignParams,
) {
  const {
    creatorAddress,
    creatorKeyHash,
    utxos,
    collateralUtxo,
    campaignUtxo,
    campaignDatum,
  } = params;

  // 1. Spend campaign UTxO with Cancel
  txBuilder
    .spendingPlutusScriptV3()
    .txIn(
      campaignUtxo.input.txHash,
      campaignUtxo.input.outputIndex,
      campaignUtxo.output.amount,
      contracts.campaign.address,
    )
    .txInScript(contracts.campaign.compiledCode)
    .txInInlineDatumPresent()
    .txInRedeemerValue(CampaignRedeemer.cancel());

  // 2. Strictly before deadline
  txBuilder.invalidHereafter(campaignDatum.deadline - 1);

  // 3. Creator signature
  txBuilder.requiredSignerHash(creatorKeyHash);

  // 4. Refund deposit collateral
  txBuilder.txOut(creatorAddress, [
    { unit: "lovelace", quantity: campaignDatum.deposit_collateral.toString() },
  ]);

  if (collateralUtxo) {
    txBuilder.txInCollateral(
      collateralUtxo.input.txHash,
      collateralUtxo.input.outputIndex,
      collateralUtxo.output.amount,
      collateralUtxo.output.address,
    );
  }

  txBuilder.changeAddress(creatorAddress).selectUtxosFrom(utxos);

  return txBuilder;
}

export function buildCloseRejectedCampaignTx(
  txBuilder: MeshTxBuilder,
  contracts: FeedMeContracts,
  params: CloseCampaignParams,
) {
  const {
    creatorAddress,
    creatorKeyHash,
    utxos,
    collateralUtxo,
    campaignUtxo,
    campaignDatum,
  } = params;

  // 1. Spend campaign UTxO with CloseRejected
  txBuilder
    .spendingPlutusScriptV3()
    .txIn(
      campaignUtxo.input.txHash,
      campaignUtxo.input.outputIndex,
      campaignUtxo.output.amount,
      contracts.campaign.address,
    )
    .txInScript(contracts.campaign.compiledCode)
    .txInInlineDatumPresent()
    .txInRedeemerValue(CampaignRedeemer.closeRejected());

  // 2. Must be after deadline
  txBuilder.invalidBefore(campaignDatum.deadline + 1);

  // 3. Creator signature
  txBuilder.requiredSignerHash(creatorKeyHash);

  // 4. Refund collateral
  txBuilder.txOut(creatorAddress, [
    { unit: "lovelace", quantity: campaignDatum.deposit_collateral.toString() },
  ]);

  if (collateralUtxo) {
    txBuilder.txInCollateral(
      collateralUtxo.input.txHash,
      collateralUtxo.input.outputIndex,
      collateralUtxo.output.amount,
      collateralUtxo.output.address,
    );
  }

  txBuilder.changeAddress(creatorAddress).selectUtxosFrom(utxos);

  return txBuilder;
}
