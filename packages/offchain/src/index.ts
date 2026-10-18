/**
 * Feed Me - Cardano Offchain SDK
 * Built with MeshJS for Plutus V3 interactions
 */

export interface TreasuryConfig {
  network: "preview" | "preprod" | "mainnet";
  treasuryScriptCbor?: string;
}

export const FEED_ME_NETWORK = "preview";
