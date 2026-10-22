import {
  BlockfrostProvider,
  MeshTxBuilder,
  deserializeAddress,
} from "@meshsdk/core";
import {
  loadFeedMeContracts,
  buildDepositTreasuryTx,
  buildCreateCampaignTx,
  buildLockVoteTicketTx,
  DEFAULT_CAMPAIGN_COLLATERAL,
  TreasuryDatum,
  toTreasuryDatum,
} from "@feed-me/offchain";

export const CARDANO_NETWORK_ID = Number(
  process.env.NEXT_PUBLIC_CARDANO_NETWORK_ID || "0"
);

export const BLOCKFROST_API_KEY =
  process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY || "";

export const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY || "";
export const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY || "";
export const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || "";

let providerInstance: BlockfrostProvider | null = null;

export function getBlockfrostProvider(): BlockfrostProvider {
  if (!providerInstance) {
    if (!BLOCKFROST_API_KEY) {
      throw new Error(
        "Missing NEXT_PUBLIC_BLOCKFROST_API_KEY in .env.local"
      );
    }
    providerInstance = new BlockfrostProvider(BLOCKFROST_API_KEY);
  }
  return providerInstance;
}

export function getFeedMeContracts() {
  return loadFeedMeContracts(CARDANO_NETWORK_ID);
}

export function getTxBuilder(): MeshTxBuilder {
  const provider = getBlockfrostProvider();
  return new MeshTxBuilder({
    fetcher: provider,
    submitter: provider,
    evaluator: provider,
  });
}

/**
 * Upload receipt/meal image to IPFS via Pinata
 */
export async function uploadToIPFS(file: File): Promise<string> {
  if (PINATA_JWT) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Pinata upload failed with status ${res.status}`);
    }

    const data = await res.json();
    return data.IpfsHash;
  }

  if (PINATA_API_KEY && PINATA_SECRET_KEY) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Pinata upload failed with status ${res.status}`);
    }

    const data = await res.json();
    return data.IpfsHash;
  }

  // Fallback demo CID
  return `bafkrei${Date.now().toString(16)}${Math.random().toString(16).slice(2, 8)}`;
}

/**
 * Create a Campaign Proposal on Cardano Preview testnet
 * Locks 2 ADA collateral in Plutus V3 campaign validator
 */
export async function submitCreateCampaignProposal(
  wallet: any,
  params: {
    title: string;
    requestedAda: number;
    deadlineDays: number;
    metadata?: Record<string, unknown>;
  }
): Promise<string> {
  const contracts = getFeedMeContracts();
  const txBuilder = getTxBuilder();

  const changeAddress = await wallet.getChangeAddress();
  const creatorKeyHash = deserializeAddress(changeAddress).pubKeyHash;
  const utxos = await wallet.getUtxos();
  const collaterals = await wallet.getCollateral();

  if (!utxos || utxos.length === 0) {
    throw new Error("Ví của bạn chưa có UTxO (tADA). Vui lòng nạp tADA từ Faucet.");
  }

  const campaignIdHex = Buffer.from(
    `feedme_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  ).toString("hex").substring(0, 32);

  const deadlinePosixTime = Date.now() + params.deadlineDays * 24 * 60 * 60 * 1000;
  const requestedLovelace = params.requestedAda * 1_000_000;

  buildCreateCampaignTx(txBuilder, contracts, {
    creatorAddress: changeAddress,
    creatorKeyHash,
    utxos,
    collateralUtxo: collaterals && collaterals.length > 0 ? collaterals[0] : undefined,
    campaignIdHex,
    requestedLovelace,
    deadlinePosixTime,
    collateralLovelace: DEFAULT_CAMPAIGN_COLLATERAL,
    metadata: {
      title: params.title,
      ...params.metadata,
    },
  });

  const unsignedTx = await txBuilder.complete();
  const signedTx = await wallet.signTx(unsignedTx, true);
  const txHash = await wallet.submitTx(signedTx);

  return txHash;
}

/**
 * Initialize or deposit into the Treasury pool on Cardano Preview testnet
 */
export async function submitDepositTreasury(
  wallet: any,
  adaAmount: number
): Promise<string> {
  const provider = getBlockfrostProvider();
  const contracts = getFeedMeContracts();
  const txBuilder = getTxBuilder();

  const changeAddress = await wallet.getChangeAddress();
  const utxos = await wallet.getUtxos();
  const collaterals = await wallet.getCollateral();

  if (!utxos || utxos.length === 0) {
    throw new Error("Ví của bạn chưa có UTxO (tADA). Vui lòng nạp tADA từ Faucet.");
  }

  const depositLovelace = adaAmount * 1_000_000;
  const treasuryUtxos = await provider.fetchAddressUTxOs(contracts.treasury.address);

  // If treasury has no UTxO yet, perform Genesis initialization
  if (treasuryUtxos.length === 0) {
    const initialDatum: TreasuryDatum = {
      total_staked: depositLovelace,
      epoch_counter: 0,
      last_yield_distribution: Date.now(),
      authorized_campaign_script: contracts.campaign.hash,
    };

    txBuilder
      .txOut(contracts.treasury.address, [
        { unit: "lovelace", quantity: depositLovelace.toString() },
      ])
      .txOutInlineDatumValue(toTreasuryDatum(initialDatum), "JSON")
      .changeAddress(changeAddress)
      .selectUtxosFrom(utxos);

    const unsignedTx = await txBuilder.complete();
    const signedTx = await wallet.signTx(unsignedTx, true);
    return await wallet.submitTx(signedTx);
  }

  // Spend existing treasury UTxO, update datum, and mint $FEED
  const treasuryUtxo = treasuryUtxos[0];
  const currentDatum: TreasuryDatum = {
    total_staked: depositLovelace,
    epoch_counter: 0,
    last_yield_distribution: Date.now(),
    authorized_campaign_script: contracts.campaign.hash,
  };

  buildDepositTreasuryTx(txBuilder, contracts, {
    walletAddress: changeAddress,
    utxos,
    collateralUtxo: collaterals && collaterals.length > 0 ? collaterals[0] : undefined,
    treasuryUtxo,
    currentDatum,
    depositLovelace,
  });

  const unsignedTx = await txBuilder.complete();
  const signedTx = await wallet.signTx(unsignedTx, true);
  return await wallet.submitTx(signedTx);
}

/**
 * Submit Quadratic Vote Ticket transaction on Cardano Preview testnet
 */
export async function submitVoteTicket(
  wallet: any,
  params: {
    campaignIdHex: string;
    feedAmount: number;
    choice: "yes" | "no";
    expiryDays?: number;
  }
): Promise<string> {
  const contracts = getFeedMeContracts();
  const txBuilder = getTxBuilder();

  const changeAddress = await wallet.getChangeAddress();
  const voterKeyHash = deserializeAddress(changeAddress).pubKeyHash;
  const utxos = await wallet.getUtxos();
  const collaterals = await wallet.getCollateral();

  const expiryPosixTime = Date.now() + (params.expiryDays || 7) * 24 * 60 * 60 * 1000;

  buildLockVoteTicketTx(txBuilder, contracts, {
    voterAddress: changeAddress,
    voterKeyHash,
    utxos,
    collateralUtxo: collaterals && collaterals.length > 0 ? collaterals[0] : undefined,
    campaignIdHex: params.campaignIdHex,
    feedAmount: params.feedAmount,
    voteType: params.choice === "yes",
    expiryPosixTime,
  });

  const unsignedTx = await txBuilder.complete();
  const signedTx = await wallet.signTx(unsignedTx, true);
  return await wallet.submitTx(signedTx);
}
