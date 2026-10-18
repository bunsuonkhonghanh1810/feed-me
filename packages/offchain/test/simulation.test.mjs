import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MeshTxBuilder } from "@meshsdk/core";
import {
  loadFeedMeContracts,
  buildDepositTreasuryTx,
  buildUnstakeTreasuryTx,
  buildDisburseTreasuryTx,
  buildCreateCampaignTx,
  buildCloseAndClaimCampaignTx,
  buildCancelCampaignTx,
  buildCloseRejectedCampaignTx,
  buildLockVoteTicketTx,
  buildReclaimVoteTicketTx,
  calculateVotePower,
  FEED_TOKEN_NAME_HEX,
  CampaignStatus,
  DEFAULT_CAMPAIGN_COLLATERAL,
} from "../dist/index.js";

function flushTx(txBuilder) {
  txBuilder.queueAllLastItem();
}

describe("Feed Me Offchain SDK - Transaction Builders & Contract Simulation", () => {
  const contracts = loadFeedMeContracts(0); // Preview testnet

  const mockWalletAddress =
    "addr_test1qpvx0sacufuypa2k4sngk7q40zc5c4npl337uusdh64kv0uafhxhu32dys6pvn6wlw8dav6cmp4pmtv7cc3yel9uu0nq93swx9";
  const mockWalletPkh = "5867c3b8e27840f556ac268b781578b14c5661fc63ee720dbeab663f";

  const mockRecipientAddress =
    "addr_test1qprypfas54dtkurhja3559ztqu8akaxcje5uwvn3ke6r5nh2rqqe536qkktvzys2t67q8c53hfpgdcekghpjy6mhd4fscad3tw";
  const mockRecipientPkh = "4640a7b0a55abb707797634a144b070fdb74d89669c73271b6743a4e";

  const mockWalletUtxo = {
    input: {
      txHash: "1111111111111111111111111111111111111111111111111111111111111111",
      outputIndex: 0,
    },
    output: {
      address: mockWalletAddress,
      amount: [{ unit: "lovelace", quantity: "100000000" }],
    },
  };

  const mockCollateralUtxo = {
    input: {
      txHash: "2222222222222222222222222222222222222222222222222222222222222222",
      outputIndex: 0,
    },
    output: {
      address: mockWalletAddress,
      amount: [{ unit: "lovelace", quantity: "5000000" }],
    },
  };

  const mockTreasuryUtxo = {
    input: {
      txHash: "3333333333333333333333333333333333333333333333333333333333333333",
      outputIndex: 0,
    },
    output: {
      address: contracts.treasury.address,
      amount: [{ unit: "lovelace", quantity: "50000000" }],
    },
  };

  const mockInitialTreasuryDatum = {
    total_staked: 50_000_000,
    epoch_counter: 1,
    last_yield_distribution: 1700000000000,
    authorized_campaign_script: contracts.campaign.hash,
  };

  describe("Contract Blueprint Parser", () => {
    it("should correctly load all validators and generate Plutus V3 testnet addresses", () => {
      assert.ok(contracts.treasury.address.startsWith("addr_test"));
      assert.ok(contracts.campaign.address.startsWith("addr_test"));
      assert.ok(contracts.voteTicket.address.startsWith("addr_test"));
      assert.strictEqual(contracts.treasury.version, "V3");
      assert.strictEqual(contracts.campaign.version, "V3");
      assert.strictEqual(contracts.voteTicket.version, "V3");
      assert.strictEqual(contracts.feedPolicyId, contracts.treasury.hash);
      assert.strictEqual(contracts.networkId, 0);
    });
  });

  describe("Treasury Transactions", () => {
    it("should build a valid Deposit transaction (mint $FEED 1:1)", () => {
      const txBuilder = new MeshTxBuilder();
      const depositAmount = 20_000_000; // 20 ADA

      buildDepositTreasuryTx(txBuilder, contracts, {
        walletAddress: mockWalletAddress,
        utxos: [mockWalletUtxo],
        collateralUtxo: mockCollateralUtxo,
        treasuryUtxo: mockTreasuryUtxo,
        currentDatum: mockInitialTreasuryDatum,
        depositLovelace: depositAmount,
      });

      flushTx(txBuilder);
      const body = txBuilder.meshTxBuilderBody;

      // 1. Script input for treasury
      assert.strictEqual(body.inputs.length, 1);
      assert.strictEqual(body.inputs[0].txIn.txHash, mockTreasuryUtxo.input.txHash);

      // 2. Mint $FEED token
      assert.strictEqual(body.mints.length, 1);
      assert.strictEqual(body.mints[0].policyId, contracts.feedPolicyId);
      const mintEntry = body.mints[0].mintValue.find(
        (m) => m.assetName === FEED_TOKEN_NAME_HEX,
      );
      assert.ok(mintEntry);
      assert.strictEqual(mintEntry.amount, depositAmount.toString());

      // 3. Continuing treasury output + user $FEED output
      assert.strictEqual(body.outputs.length, 2);
      assert.strictEqual(body.outputs[0].address, contracts.treasury.address);
      assert.strictEqual(
        body.outputs[0].amount[0].quantity,
        (50_000_000 + depositAmount).toString(),
      );

      assert.strictEqual(body.outputs[1].address, mockWalletAddress);
      const feedToken = body.outputs[1].amount.find(
        (a) => a.unit === contracts.feedPolicyId + FEED_TOKEN_NAME_HEX,
      );
      assert.ok(feedToken);
      assert.strictEqual(feedToken.quantity, depositAmount.toString());

      // 4. Collateral & change address
      assert.strictEqual(body.collaterals.length, 1);
      assert.strictEqual(body.changeAddress, mockWalletAddress);
    });

    it("should build a valid Unstake transaction (burn $FEED 1:1)", () => {
      const txBuilder = new MeshTxBuilder();
      const unstakeAmount = 10_000_000; // 10 ADA

      buildUnstakeTreasuryTx(txBuilder, contracts, {
        walletAddress: mockWalletAddress,
        utxos: [mockWalletUtxo],
        collateralUtxo: mockCollateralUtxo,
        treasuryUtxo: mockTreasuryUtxo,
        currentDatum: mockInitialTreasuryDatum,
        unstakeLovelace: unstakeAmount,
      });

      flushTx(txBuilder);
      const body = txBuilder.meshTxBuilderBody;

      // 1. Script input
      assert.strictEqual(body.inputs.length, 1);

      // 2. Burn $FEED (negative mint amount)
      assert.strictEqual(body.mints.length, 1);
      const burnEntry = body.mints[0].mintValue.find(
        (m) => m.assetName === FEED_TOKEN_NAME_HEX,
      );
      assert.ok(burnEntry);
      assert.strictEqual(burnEntry.amount, (-unstakeAmount).toString());

      // 3. Continuing treasury output with reduced total
      assert.strictEqual(body.outputs[0].address, contracts.treasury.address);
      assert.strictEqual(
        body.outputs[0].amount[0].quantity,
        (50_000_000 - unstakeAmount).toString(),
      );

      // 4. Return ADA to user
      assert.strictEqual(body.outputs[1].address, mockWalletAddress);
      assert.strictEqual(body.outputs[1].amount[0].quantity, unstakeAmount.toString());
    });

    it("should throw error when unstaking more than total staked", () => {
      const txBuilder = new MeshTxBuilder();
      assert.throws(
        () =>
          buildUnstakeTreasuryTx(txBuilder, contracts, {
            walletAddress: mockWalletAddress,
            utxos: [mockWalletUtxo],
            collateralUtxo: mockCollateralUtxo,
            treasuryUtxo: mockTreasuryUtxo,
            currentDatum: mockInitialTreasuryDatum,
            unstakeLovelace: 60_000_000, // exceeds 50_000_000
          }),
        /exceeds total staked/,
      );
    });

    it("should build a valid Disburse transaction using campaign as reference input", () => {
      const txBuilder = new MeshTxBuilder();
      const disburseAmount = 5_000_000;
      const campaignIdHex = "63616d706169676e31"; // "campaign1"

      const mockCampaignUtxo = {
        input: {
          txHash: "4444444444444444444444444444444444444444444444444444444444444444",
          outputIndex: 0,
        },
        output: {
          address: contracts.campaign.address,
          amount: [{ unit: "lovelace", quantity: "2000000" }],
        },
      };

      buildDisburseTreasuryTx(txBuilder, contracts, {
        walletAddress: mockWalletAddress,
        utxos: [mockWalletUtxo],
        collateralUtxo: mockCollateralUtxo,
        treasuryUtxo: mockTreasuryUtxo,
        currentTreasuryDatum: mockInitialTreasuryDatum,
        campaignUtxo: mockCampaignUtxo,
        campaignIdHex,
        recipientAddress: mockRecipientAddress,
        recipientKeyHash: mockRecipientPkh,
        disburseLovelace: disburseAmount,
      });

      flushTx(txBuilder);
      const body = txBuilder.meshTxBuilderBody;

      // 1. Treasury script input
      assert.strictEqual(body.inputs.length, 1);

      // 2. Reference input for campaign (read-only witness)
      assert.strictEqual(body.referenceInputs.length, 1);
      assert.strictEqual(
        body.referenceInputs[0].txHash,
        mockCampaignUtxo.input.txHash,
      );

      // 3. Payout to recipient
      const recipientOut = body.outputs.find((o) => o.address === mockRecipientAddress);
      assert.ok(recipientOut);
      assert.strictEqual(recipientOut.amount[0].quantity, disburseAmount.toString());
    });
  });

  describe("Campaign Transactions", () => {
    const deadline = 1800000000000;
    const requestedLovelace = 15_000_000;
    const campaignIdHex = "63616d706169676e31";

    const mockCampaignDatum = {
      campaign_id: campaignIdHex,
      creator: mockWalletPkh,
      requested_amount: requestedLovelace,
      deposit_collateral: DEFAULT_CAMPAIGN_COLLATERAL,
      deadline,
      yes_votes_sqrt: 10,
      total_votes_sqrt: 12,
      status: CampaignStatus.Active,
    };

    const mockCampaignUtxo = {
      input: {
        txHash: "4444444444444444444444444444444444444444444444444444444444444444",
        outputIndex: 0,
      },
      output: {
        address: contracts.campaign.address,
        amount: [
          { unit: "lovelace", quantity: DEFAULT_CAMPAIGN_COLLATERAL.toString() },
        ],
      },
    };

    it("should build a valid CreateCampaign transaction with 2 ADA deposit", () => {
      const txBuilder = new MeshTxBuilder();

      buildCreateCampaignTx(txBuilder, contracts, {
        creatorAddress: mockWalletAddress,
        creatorKeyHash: mockWalletPkh,
        utxos: [mockWalletUtxo],
        collateralUtxo: mockCollateralUtxo,
        campaignIdHex,
        requestedLovelace,
        deadlinePosixTime: deadline,
        metadata: { title: "Cơm trưa sinh viên", category: "food" },
      });

      flushTx(txBuilder);
      const body = txBuilder.meshTxBuilderBody;

      // 1. Output locked at Campaign validator
      assert.strictEqual(body.outputs.length, 1);
      assert.strictEqual(body.outputs[0].address, contracts.campaign.address);
      assert.strictEqual(
        body.outputs[0].amount[0].quantity,
        DEFAULT_CAMPAIGN_COLLATERAL.toString(),
      );

      // 2. Metadata attached with label 674
      assert.ok(body.metadata.has(674n));
      assert.strictEqual(body.changeAddress, mockWalletAddress);
    });

    it("should build a valid CloseAndClaim transaction with invalidBefore after deadline", () => {
      const txBuilder = new MeshTxBuilder();

      buildCloseAndClaimCampaignTx(txBuilder, contracts, {
        creatorAddress: mockWalletAddress,
        creatorKeyHash: mockWalletPkh,
        utxos: [mockWalletUtxo],
        collateralUtxo: mockCollateralUtxo,
        campaignUtxo: mockCampaignUtxo,
        campaignDatum: mockCampaignDatum,
      });

      flushTx(txBuilder);
      const body = txBuilder.meshTxBuilderBody;

      // 1. Spends campaign UTxO
      assert.strictEqual(body.inputs.length, 1);
      assert.strictEqual(body.inputs[0].txIn.txHash, mockCampaignUtxo.input.txHash);

      // 2. Validity range after deadline
      assert.strictEqual(body.validityRange.invalidBefore, deadline + 1);

      // 3. Creator signature
      assert.ok(body.requiredSignatures.includes(mockWalletPkh));

      // 4. Returns 2 ADA collateral to creator
      assert.strictEqual(body.outputs[0].address, mockWalletAddress);
      assert.strictEqual(
        body.outputs[0].amount[0].quantity,
        DEFAULT_CAMPAIGN_COLLATERAL.toString(),
      );
    });

    it("should build a valid Cancel transaction before deadline", () => {
      const txBuilder = new MeshTxBuilder();

      buildCancelCampaignTx(txBuilder, contracts, {
        creatorAddress: mockWalletAddress,
        creatorKeyHash: mockWalletPkh,
        utxos: [mockWalletUtxo],
        collateralUtxo: mockCollateralUtxo,
        campaignUtxo: mockCampaignUtxo,
        campaignDatum: mockCampaignDatum,
      });

      flushTx(txBuilder);
      const body = txBuilder.meshTxBuilderBody;

      assert.strictEqual(body.inputs.length, 1);
      assert.strictEqual(body.validityRange.invalidHereafter, deadline - 1);
      assert.ok(body.requiredSignatures.includes(mockWalletPkh));
    });

    it("should build a valid CloseRejected transaction after deadline", () => {
      const txBuilder = new MeshTxBuilder();

      buildCloseRejectedCampaignTx(txBuilder, contracts, {
        creatorAddress: mockWalletAddress,
        creatorKeyHash: mockWalletPkh,
        utxos: [mockWalletUtxo],
        collateralUtxo: mockCollateralUtxo,
        campaignUtxo: mockCampaignUtxo,
        campaignDatum: mockCampaignDatum,
      });

      flushTx(txBuilder);
      const body = txBuilder.meshTxBuilderBody;

      assert.strictEqual(body.inputs.length, 1);
      assert.strictEqual(body.validityRange.invalidBefore, deadline + 1);
      assert.ok(body.requiredSignatures.includes(mockWalletPkh));
    });
  });

  describe("Quadratic Voting & Vote Tickets", () => {
    it("should correctly compute vote power as integer square root", () => {
      assert.strictEqual(calculateVotePower(0), 0);
      assert.strictEqual(calculateVotePower(1), 1);
      assert.strictEqual(calculateVotePower(3), 1);
      assert.strictEqual(calculateVotePower(4), 2);
      assert.strictEqual(calculateVotePower(8), 2);
      assert.strictEqual(calculateVotePower(9), 3);
      assert.strictEqual(calculateVotePower(16), 4);
      assert.strictEqual(calculateVotePower(25), 5);
      assert.strictEqual(calculateVotePower(100), 10);
      assert.strictEqual(calculateVotePower(10_000), 100);
      assert.strictEqual(calculateVotePower(1_000_000), 1000);
    });

    it("should build a valid LockVoteTicket transaction locking $FEED tokens", () => {
      const txBuilder = new MeshTxBuilder();
      const feedAmount = 16;
      const expiry = 1750000000000;

      buildLockVoteTicketTx(txBuilder, contracts, {
        voterAddress: mockWalletAddress,
        voterKeyHash: mockWalletPkh,
        utxos: [mockWalletUtxo],
        collateralUtxo: mockCollateralUtxo,
        campaignIdHex: "63616d706169676e31",
        feedAmount,
        voteType: true,
        expiryPosixTime: expiry,
      });

      flushTx(txBuilder);
      const body = txBuilder.meshTxBuilderBody;

      // 1. Output locked at VoteTicket contract
      assert.strictEqual(body.outputs.length, 1);
      assert.strictEqual(body.outputs[0].address, contracts.voteTicket.address);

      const feedLocked = body.outputs[0].amount.find(
        (a) => a.unit === contracts.feedPolicyId + FEED_TOKEN_NAME_HEX,
      );
      assert.ok(feedLocked);
      assert.strictEqual(feedLocked.quantity, feedAmount.toString());
      assert.strictEqual(body.changeAddress, mockWalletAddress);
    });

    it("should build a valid ReclaimVoteTicket transaction after ticket expiry", () => {
      const txBuilder = new MeshTxBuilder();
      const expiry = 1750000000000;

      const mockTicketDatum = {
        voter: mockWalletPkh,
        campaign_id: "63616d706169676e31",
        locked_feed_tokens: 16,
        vote_power: 4,
        vote_type: true,
        expiry,
      };

      const mockTicketUtxo = {
        input: {
          txHash: "5555555555555555555555555555555555555555555555555555555555555555",
          outputIndex: 0,
        },
        output: {
          address: contracts.voteTicket.address,
          amount: [
            { unit: "lovelace", quantity: "2000000" },
            {
              unit: contracts.feedPolicyId + FEED_TOKEN_NAME_HEX,
              quantity: "16",
            },
          ],
        },
      };

      buildReclaimVoteTicketTx(txBuilder, contracts, {
        voterAddress: mockWalletAddress,
        voterKeyHash: mockWalletPkh,
        utxos: [mockWalletUtxo],
        collateralUtxo: mockCollateralUtxo,
        ticketUtxo: mockTicketUtxo,
        ticketDatum: mockTicketDatum,
      });

      flushTx(txBuilder);
      const body = txBuilder.meshTxBuilderBody;

      // 1. Spends ticket UTxO
      assert.strictEqual(body.inputs.length, 1);
      assert.strictEqual(body.inputs[0].txIn.txHash, mockTicketUtxo.input.txHash);

      // 2. Validity range after expiry
      assert.strictEqual(body.validityRange.invalidBefore, expiry + 1);

      // 3. Voter must sign
      assert.ok(body.requiredSignatures.includes(mockWalletPkh));

      // 4. Returns all locked assets back to voter
      assert.strictEqual(body.outputs[0].address, mockWalletAddress);
      assert.deepStrictEqual(body.outputs[0].amount, mockTicketUtxo.output.amount);
    });
  });
});
