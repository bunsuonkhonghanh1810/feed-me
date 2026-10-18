import { MeshTxBuilder, UTxO } from "@meshsdk/core";
import {
  FEED_TOKEN_NAME_HEX,
  toTreasuryDatum,
  TreasuryDatum,
  TreasuryRedeemer,
} from "./types.js";
import { FeedMeContracts } from "./parser.js";

export interface DepositTreasuryParams {
  walletAddress: string;
  utxos: UTxO[];
  collateralUtxo?: UTxO;
  treasuryUtxo: UTxO;
  currentDatum: TreasuryDatum;
  depositLovelace: number;
}

export interface UnstakeTreasuryParams {
  walletAddress: string;
  utxos: UTxO[];
  collateralUtxo?: UTxO;
  treasuryUtxo: UTxO;
  currentDatum: TreasuryDatum;
  unstakeLovelace: number;
}

export interface DisburseTreasuryParams {
  walletAddress: string;
  utxos: UTxO[];
  collateralUtxo?: UTxO;
  treasuryUtxo: UTxO;
  currentTreasuryDatum: TreasuryDatum;
  campaignUtxo: UTxO;
  campaignIdHex: string;
  recipientAddress: string;
  recipientKeyHash: string;
  disburseLovelace: number;
}

export function buildDepositTreasuryTx(
  txBuilder: MeshTxBuilder,
  contracts: FeedMeContracts,
  params: DepositTreasuryParams,
) {
  const {
    walletAddress,
    utxos,
    collateralUtxo,
    treasuryUtxo,
    currentDatum,
    depositLovelace,
  } = params;

  const currentLovelace = Number(
    treasuryUtxo.output.amount.find((a) => a.unit === "lovelace")?.quantity || "0",
  );
  const nextLovelace = currentLovelace + depositLovelace;

  const nextDatum: TreasuryDatum = {
    ...currentDatum,
    total_staked: currentDatum.total_staked + depositLovelace,
  };

  const redeemer = TreasuryRedeemer.deposit(depositLovelace);

  // 1. Spend treasury UTxO to update state
  txBuilder
    .spendingPlutusScriptV3()
    .txIn(
      treasuryUtxo.input.txHash,
      treasuryUtxo.input.outputIndex,
      treasuryUtxo.output.amount,
      contracts.treasury.address,
    )
    .txInScript(contracts.treasury.compiledCode)
    .txInInlineDatumPresent()
    .txInRedeemerValue(redeemer, "JSON");

  // 2. Mint $FEED 1:1 using Treasury mint handler
  txBuilder
    .mintPlutusScriptV3()
    .mint(
      depositLovelace.toString(),
      contracts.feedPolicyId,
      FEED_TOKEN_NAME_HEX,
    )
    .mintingScript(contracts.treasury.compiledCode)
    .mintRedeemerValue(redeemer, "JSON");

  // 3. Treasury continuing output
  txBuilder
    .txOut(contracts.treasury.address, [
      { unit: "lovelace", quantity: nextLovelace.toString() },
    ])
    .txOutInlineDatumValue(toTreasuryDatum(nextDatum), "JSON");

  // 4. Staker receives $FEED tokens
  txBuilder.txOut(walletAddress, [
    { unit: "lovelace", quantity: "2000000" },
    {
      unit: contracts.feedPolicyId + FEED_TOKEN_NAME_HEX,
      quantity: depositLovelace.toString(),
    },
  ]);

  if (collateralUtxo) {
    txBuilder.txInCollateral(
      collateralUtxo.input.txHash,
      collateralUtxo.input.outputIndex,
      collateralUtxo.output.amount,
      collateralUtxo.output.address,
    );
  }

  txBuilder.changeAddress(walletAddress).selectUtxosFrom(utxos);

  return txBuilder;
}

export function buildUnstakeTreasuryTx(
  txBuilder: MeshTxBuilder,
  contracts: FeedMeContracts,
  params: UnstakeTreasuryParams,
) {
  const {
    walletAddress,
    utxos,
    collateralUtxo,
    treasuryUtxo,
    currentDatum,
    unstakeLovelace,
  } = params;

  if (unstakeLovelace > currentDatum.total_staked) {
    throw new Error(
      `Unstake amount (${unstakeLovelace}) exceeds total staked (${currentDatum.total_staked})`,
    );
  }

  const currentLovelace = Number(
    treasuryUtxo.output.amount.find((a) => a.unit === "lovelace")?.quantity || "0",
  );
  const nextLovelace = Math.max(0, currentLovelace - unstakeLovelace);

  const nextDatum: TreasuryDatum = {
    ...currentDatum,
    total_staked: currentDatum.total_staked - unstakeLovelace,
  };

  const redeemer = TreasuryRedeemer.unstake(unstakeLovelace);

  // 1. Spend treasury UTxO
  txBuilder
    .spendingPlutusScriptV3()
    .txIn(
      treasuryUtxo.input.txHash,
      treasuryUtxo.input.outputIndex,
      treasuryUtxo.output.amount,
      contracts.treasury.address,
    )
    .txInScript(contracts.treasury.compiledCode)
    .txInInlineDatumPresent()
    .txInRedeemerValue(redeemer, "JSON");

  // 2. Burn $FEED tokens
  txBuilder
    .mintPlutusScriptV3()
    .mint(
      (-unstakeLovelace).toString(),
      contracts.feedPolicyId,
      FEED_TOKEN_NAME_HEX,
    )
    .mintingScript(contracts.treasury.compiledCode)
    .mintRedeemerValue(redeemer, "JSON");

  // 3. Treasury continuing output
  txBuilder
    .txOut(contracts.treasury.address, [
      { unit: "lovelace", quantity: nextLovelace.toString() },
    ])
    .txOutInlineDatumValue(toTreasuryDatum(nextDatum), "JSON");

  // 4. Return ADA to staker
  txBuilder.txOut(walletAddress, [
    { unit: "lovelace", quantity: unstakeLovelace.toString() },
  ]);

  if (collateralUtxo) {
    txBuilder.txInCollateral(
      collateralUtxo.input.txHash,
      collateralUtxo.input.outputIndex,
      collateralUtxo.output.amount,
      collateralUtxo.output.address,
    );
  }

  txBuilder.changeAddress(walletAddress).selectUtxosFrom(utxos);

  return txBuilder;
}

export function buildDisburseTreasuryTx(
  txBuilder: MeshTxBuilder,
  contracts: FeedMeContracts,
  params: DisburseTreasuryParams,
) {
  const {
    walletAddress,
    utxos,
    collateralUtxo,
    treasuryUtxo,
    currentTreasuryDatum,
    campaignUtxo,
    campaignIdHex,
    recipientAddress,
    recipientKeyHash,
    disburseLovelace,
  } = params;

  if (disburseLovelace > currentTreasuryDatum.total_staked) {
    throw new Error(
      `Disburse amount (${disburseLovelace}) exceeds total staked (${currentTreasuryDatum.total_staked})`,
    );
  }

  const currentLovelace = Number(
    treasuryUtxo.output.amount.find((a) => a.unit === "lovelace")?.quantity || "0",
  );
  const nextLovelace = Math.max(0, currentLovelace - disburseLovelace);

  const nextDatum: TreasuryDatum = {
    ...currentTreasuryDatum,
    total_staked: currentTreasuryDatum.total_staked - disburseLovelace,
  };

  const redeemer = TreasuryRedeemer.disburse(
    campaignIdHex,
    recipientKeyHash,
    disburseLovelace,
  );

  // 1. Spend treasury UTxO
  txBuilder
    .spendingPlutusScriptV3()
    .txIn(
      treasuryUtxo.input.txHash,
      treasuryUtxo.input.outputIndex,
      treasuryUtxo.output.amount,
      contracts.treasury.address,
    )
    .txInScript(contracts.treasury.compiledCode)
    .txInInlineDatumPresent()
    .txInRedeemerValue(redeemer, "JSON");

  // 2. Read approved campaign UTxO as reference input (authenticated witness)
  txBuilder.readOnlyTxInReference(
    campaignUtxo.input.txHash,
    campaignUtxo.input.outputIndex,
  );

  // 3. Continuing treasury output
  txBuilder
    .txOut(contracts.treasury.address, [
      { unit: "lovelace", quantity: nextLovelace.toString() },
    ])
    .txOutInlineDatumValue(toTreasuryDatum(nextDatum), "JSON");

  // 4. Payout to micro-grant recipient
  txBuilder.txOut(recipientAddress, [
    { unit: "lovelace", quantity: disburseLovelace.toString() },
  ]);

  if (collateralUtxo) {
    txBuilder.txInCollateral(
      collateralUtxo.input.txHash,
      collateralUtxo.input.outputIndex,
      collateralUtxo.output.amount,
      collateralUtxo.output.address,
    );
  }

  txBuilder.changeAddress(walletAddress).selectUtxosFrom(utxos);

  return txBuilder;
}
