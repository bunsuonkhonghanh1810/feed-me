import { resolvePlutusScriptAddress } from "@meshsdk/core";
import plutusBlueprint from "./plutus.json" with { type: "json" };

export interface PlutusScriptDefinition {
  title: string;
  compiledCode: string;
  hash: string;
  version: "V3";
  address: string;
}

export interface FeedMeContracts {
  networkId: number;
  feedPolicyId: string;
  treasury: PlutusScriptDefinition;
  campaign: PlutusScriptDefinition;
  voteTicket: PlutusScriptDefinition;
}

function findValidator(title: string) {
  const validator = plutusBlueprint.validators.find((v) => v.title === title);
  if (!validator) {
    throw new Error(`Validator with title "${title}" not found in plutus.json`);
  }
  return validator;
}

export function loadFeedMeContracts(networkId: number = 0): FeedMeContracts {
  const treasuryRaw = findValidator("treasury.treasury.spend");
  const campaignRaw = findValidator("campaign.campaign.spend");
  const voteTicketRaw = findValidator("vote_ticket.vote_ticket.spend");

  const treasury: PlutusScriptDefinition = {
    title: treasuryRaw.title,
    compiledCode: treasuryRaw.compiledCode,
    hash: treasuryRaw.hash,
    version: "V3",
    address: resolvePlutusScriptAddress(
      { code: treasuryRaw.compiledCode, version: "V3" },
      networkId,
    ),
  };

  const campaign: PlutusScriptDefinition = {
    title: campaignRaw.title,
    compiledCode: campaignRaw.compiledCode,
    hash: campaignRaw.hash,
    version: "V3",
    address: resolvePlutusScriptAddress(
      { code: campaignRaw.compiledCode, version: "V3" },
      networkId,
    ),
  };

  const voteTicket: PlutusScriptDefinition = {
    title: voteTicketRaw.title,
    compiledCode: voteTicketRaw.compiledCode,
    hash: voteTicketRaw.hash,
    version: "V3",
    address: resolvePlutusScriptAddress(
      { code: voteTicketRaw.compiledCode, version: "V3" },
      networkId,
    ),
  };

  return {
    networkId,
    feedPolicyId: treasury.hash,
    treasury,
    campaign,
    voteTicket,
  };
}
