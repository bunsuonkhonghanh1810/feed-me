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

describe("Feed Me Protocol - Full End-to-End (E2E) Integration Flow", () => {
  // Load Plutus V3 contracts for Preview testnet (networkId = 0)
  const contracts = loadFeedMeContracts(0);

  // Participant 1: Community Staker
  const stakerAddress =
    "addr_test1qpvx0sacufuypa2k4sngk7q40zc5c4npl337uusdh64kv0uafhxhu32dys6pvn6wlw8dav6cmp4pmtv7cc3yel9uu0nq93swx9";
  const stakerPkh = "5867c3b8e27840f556ac268b781578b14c5661fc63ee720dbeab663f";

  // Participant 2: Student Campaign Creator
  const studentAddress =
    "addr_test1qprypfas54dtkurhja3559ztqu8akaxcje5uwvn3ke6r5nh2rqqe536qkktvzys2t67q8c53hfpgdcekghpjy6mhd4fscad3tw";
  const studentPkh = "4640a7b0a55abb707797634a144b070fdb74d89669c73271b6743a4e";

  // Participant 3: Community Voter 1 (YES)
  const voter1Address =
    "addr_test1qr6njfg47dedyktm4sueclcqahvgtqklg4jn6jg84v78hvm7mmw590wd0qek26yjfw7dd5xjewgm96kfk39ryzxhvj9qx8agpa";
  const voter1Pkh = "f5392515f372d2597bac399c7f00edd88582df45653d4907ab3c7bb3";

  // Participant 4: Community Voter 2 (NO)
  const voter2Address =
    "addr_test1qq6vunzzg8g93jhz75zw99tysf0jfycr3d4huljd2xphn9cdnfwtjul2854cz5uhsytrwmy45hnv945uryzuvylcan9sg7wxr9";
  const voter2Pkh = "34ce4c4241d058cae2f504e29564825f2493038b6b7e7e4d51837997";

  // Initial Treasury UTxO & Datum state
  let treasuryLovelace = 500_000_000; // 500 ADA initial pool
  let currentTreasuryDatum = {
    total_staked: treasuryLovelace,
    epoch_counter: 490,
    last_yield_distribution: 1700000000000,
    authorized_campaign_script: contracts.campaign.hash,
  };

  let treasuryUtxo = {
    input: {
      txHash: "0000000000000000000000000000000000000000000000000000000000000001",
      outputIndex: 0,
    },
    output: {
      address: contracts.treasury.address,
      amount: [{ unit: "lovelace", quantity: treasuryLovelace.toString() }],
    },
  };

  const collateralUtxo = {
    input: {
      txHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      outputIndex: 0,
    },
    output: {
      address: stakerAddress,
      amount: [{ unit: "lovelace", quantity: "5000000" }],
    },
  };

  it("Step 1: Staker deposits 100 ADA into Treasury, minting 100 $FEED tokens (1:1 ratio)", () => {
    const depositAmount = 100_000_000; // 100 ADA
    const txBuilder = new MeshTxBuilder();

    const stakerUtxo = {
      input: {
        txHash: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        outputIndex: 0,
      },
      output: {
        address: stakerAddress,
        amount: [{ unit: "lovelace", quantity: "200000000" }],
      },
    };

    buildDepositTreasuryTx(txBuilder, contracts, {
      walletAddress: stakerAddress,
      utxos: [stakerUtxo],
      collateralUtxo,
      treasuryUtxo,
      currentDatum: currentTreasuryDatum,
      depositLovelace: depositAmount,
    });

    flushTx(txBuilder);
    const body = txBuilder.meshTxBuilderBody;

    // 1. Treasury spend input
    assert.strictEqual(body.inputs.length, 1);
    assert.strictEqual(body.inputs[0].txIn.txHash, treasuryUtxo.input.txHash);

    // 2. Mint 100 $FEED token 1:1
    assert.strictEqual(body.mints.length, 1);
    assert.strictEqual(body.mints[0].policyId, contracts.feedPolicyId);
    assert.strictEqual(body.mints[0].mintValue[0].assetName, FEED_TOKEN_NAME_HEX);
    assert.strictEqual(body.mints[0].mintValue[0].amount, depositAmount.toString());

    // 3. Updated continuing Treasury output
    treasuryLovelace += depositAmount;
    currentTreasuryDatum.total_staked += depositAmount;

    assert.strictEqual(body.outputs[0].address, contracts.treasury.address);
    assert.strictEqual(body.outputs[0].amount[0].quantity, treasuryLovelace.toString());

    // 4. Staker receives 100 $FEED tokens + min ADA
    assert.strictEqual(body.outputs[1].address, stakerAddress);
    const feedAsset = body.outputs[1].amount.find(
      (a) => a.unit === contracts.feedPolicyId + FEED_TOKEN_NAME_HEX,
    );
    assert.ok(feedAsset);
    assert.strictEqual(feedAsset.quantity, depositAmount.toString());

    // Update simulated Treasury UTxO for next step
    treasuryUtxo = {
      input: {
        txHash: "0000000000000000000000000000000000000000000000000000000000000002",
        outputIndex: 0,
      },
      output: {
        address: contracts.treasury.address,
        amount: [{ unit: "lovelace", quantity: treasuryLovelace.toString() }],
      },
    };
  });

  const campaignIdHex = "63616d706169676e5f626b68636d"; // "campaign_bkhcm"
  const requestedLovelace = 35_000_000; // 35 ADA
  const deadlinePosixTime = 1800000000000;
  let campaignUtxo = null;
  let campaignDatum = null;

  it("Step 2: Student creates Campaign Proposal and locks 2 ADA anti-spam collateral", () => {
    const txBuilder = new MeshTxBuilder();

    const studentUtxo = {
      input: {
        txHash: "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
        outputIndex: 0,
      },
      output: {
        address: studentAddress,
        amount: [{ unit: "lovelace", quantity: "50000000" }],
      },
    };

    buildCreateCampaignTx(txBuilder, contracts, {
      creatorAddress: studentAddress,
      creatorKeyHash: studentPkh,
      utxos: [studentUtxo],
      collateralUtxo,
      campaignIdHex,
      requestedLovelace,
      deadlinePosixTime,
      metadata: {
        title: "Cơm trưa 2 tuần ôn thi tốt nghiệp - ĐHBK",
        category: "meals",
        mealsCount: 70,
      },
    });

    flushTx(txBuilder);
    const body = txBuilder.meshTxBuilderBody;

    // 1. Output locked at Campaign script with 2 ADA deposit
    assert.strictEqual(body.outputs.length, 1);
    assert.strictEqual(body.outputs[0].address, contracts.campaign.address);
    assert.strictEqual(
      body.outputs[0].amount[0].quantity,
      DEFAULT_CAMPAIGN_COLLATERAL.toString(),
    );

    // 2. Metadata attached
    assert.ok(body.metadata.has(674n));

    // Save campaign state for next steps
    campaignDatum = {
      campaign_id: campaignIdHex,
      creator: studentPkh,
      requested_amount: requestedLovelace,
      deposit_collateral: DEFAULT_CAMPAIGN_COLLATERAL,
      deadline: deadlinePosixTime,
      yes_votes_sqrt: 0,
      total_votes_sqrt: 0,
      status: CampaignStatus.Active,
    };

    campaignUtxo = {
      input: {
        txHash: "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
        outputIndex: 0,
      },
      output: {
        address: contracts.campaign.address,
        amount: [
          { unit: "lovelace", quantity: DEFAULT_CAMPAIGN_COLLATERAL.toString() },
        ],
      },
    };
  });

  let voter1TicketUtxo = null;
  let voter1TicketDatum = null;

  it("Step 3: Voter 1 locks 64 $FEED tokens (vote YES) -> Power = ⌊√64⌋ = 8", () => {
    const feedAmount = 64;
    const votePower = calculateVotePower(feedAmount);
    assert.strictEqual(votePower, 8);

    const txBuilder = new MeshTxBuilder();
    const voterUtxo = {
      input: {
        txHash: "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        outputIndex: 0,
      },
      output: {
        address: voter1Address,
        amount: [
          { unit: "lovelace", quantity: "10000000" },
          {
            unit: contracts.feedPolicyId + FEED_TOKEN_NAME_HEX,
            quantity: feedAmount.toString(),
          },
        ],
      },
    };

    buildLockVoteTicketTx(txBuilder, contracts, {
      voterAddress: voter1Address,
      voterKeyHash: voter1Pkh,
      utxos: [voterUtxo],
      collateralUtxo,
      campaignIdHex,
      feedAmount,
      voteType: true,
      expiryPosixTime: deadlinePosixTime,
    });

    flushTx(txBuilder);
    const body = txBuilder.meshTxBuilderBody;

    // 1. Output locked at VoteTicket script with 64 $FEED + 2 ADA min
    assert.strictEqual(body.outputs.length, 1);
    assert.strictEqual(body.outputs[0].address, contracts.voteTicket.address);
    const feedAsset = body.outputs[0].amount.find(
      (a) => a.unit === contracts.feedPolicyId + FEED_TOKEN_NAME_HEX,
    );
    assert.ok(feedAsset);
    assert.strictEqual(feedAsset.quantity, feedAmount.toString());

    // Update campaign tally
    campaignDatum.yes_votes_sqrt += votePower;
    campaignDatum.total_votes_sqrt += votePower;

    voter1TicketDatum = {
      voter: voter1Pkh,
      campaign_id: campaignIdHex,
      locked_feed_tokens: feedAmount,
      vote_power: votePower,
      voteType: true,
      expiry: deadlinePosixTime,
    };

    voter1TicketUtxo = {
      input: {
        txHash: "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        outputIndex: 0,
      },
      output: {
        address: contracts.voteTicket.address,
        amount: [
          { unit: "lovelace", quantity: "2000000" },
          {
            unit: contracts.feedPolicyId + FEED_TOKEN_NAME_HEX,
            quantity: feedAmount.toString(),
          },
        ],
      },
    };
  });

  it("Step 4: Voter 2 locks 4 $FEED tokens (vote NO) -> Power = ⌊√4⌋ = 2", () => {
    const feedAmount = 4;
    const votePower = calculateVotePower(feedAmount);
    assert.strictEqual(votePower, 2);

    // Update campaign tally
    campaignDatum.total_votes_sqrt += votePower; // Only increments total, not YES

    // Verify consensus ratio
    // YES: 8, Total: 8 + 2 = 10 -> Ratio: 8/10 = 80% (>= 75% required by Plutus script)
    const consensusRatio = (campaignDatum.yes_votes_sqrt / campaignDatum.total_votes_sqrt) * 100;
    assert.strictEqual(consensusRatio, 80);
    assert.ok(consensusRatio >= 75, "Consensus must be >= 75% to approve disbursement");
  });

  it("Step 5: Treasury disburses 35 ADA micro-grant using approved Campaign as Reference Input", () => {
    const txBuilder = new MeshTxBuilder();

    buildDisburseTreasuryTx(txBuilder, contracts, {
      walletAddress: stakerAddress,
      utxos: [
        {
          input: {
            txHash: "1212121212121212121212121212121212121212121212121212121212121212",
            outputIndex: 0,
          },
          output: {
            address: stakerAddress,
            amount: [{ unit: "lovelace", quantity: "20000000" }],
          },
        },
      ],
      collateralUtxo,
      treasuryUtxo,
      currentTreasuryDatum,
      campaignUtxo,
      campaignIdHex,
      recipientAddress: studentAddress,
      recipientKeyHash: studentPkh,
      disburseLovelace: requestedLovelace,
    });

    flushTx(txBuilder);
    const body = txBuilder.meshTxBuilderBody;

    // 1. Spends Treasury script UTxO
    assert.strictEqual(body.inputs.length, 1);
    assert.strictEqual(body.inputs[0].txIn.txHash, treasuryUtxo.input.txHash);

    // 2. Authenticates campaign via read-only reference input (no contention)
    assert.strictEqual(body.referenceInputs.length, 1);
    assert.strictEqual(body.referenceInputs[0].txHash, campaignUtxo.input.txHash);

    // 3. Student receives 35 ADA
    const studentPayout = body.outputs.find((o) => o.address === studentAddress);
    assert.ok(studentPayout);
    assert.strictEqual(studentPayout.amount[0].quantity, requestedLovelace.toString());

    // 4. Continuing Treasury output reduced by 35 ADA
    treasuryLovelace -= requestedLovelace;
    currentTreasuryDatum.total_staked -= requestedLovelace;
    const treasuryOut = body.outputs.find((o) => o.address === contracts.treasury.address);
    assert.ok(treasuryOut);
    assert.strictEqual(treasuryOut.amount[0].quantity, treasuryLovelace.toString());
  });

  it("Step 6: Student closes campaign and reclaims 2 ADA anti-spam collateral after deadline", () => {
    const txBuilder = new MeshTxBuilder();

    buildCloseAndClaimCampaignTx(txBuilder, contracts, {
      creatorAddress: studentAddress,
      creatorKeyHash: studentPkh,
      utxos: [
        {
          input: {
            txHash: "3434343434343434343434343434343434343434343434343434343434343434",
            outputIndex: 0,
          },
          output: {
            address: studentAddress,
            amount: [{ unit: "lovelace", quantity: "10000000" }],
          },
        },
      ],
      collateralUtxo,
      campaignUtxo,
      campaignDatum,
    });

    flushTx(txBuilder);
    const body = txBuilder.meshTxBuilderBody;

    // 1. Spends campaign script UTxO
    assert.strictEqual(body.inputs.length, 1);
    assert.strictEqual(body.inputs[0].txIn.txHash, campaignUtxo.input.txHash);

    // 2. Validity range strictly after deadline
    assert.strictEqual(body.validityRange.invalidBefore, deadlinePosixTime + 1);

    // 3. Required signer is student creator
    assert.ok(body.requiredSignatures.includes(studentPkh));

    // 4. 2 ADA collateral refunded to student
    assert.strictEqual(body.outputs[0].address, studentAddress);
    assert.strictEqual(
      body.outputs[0].amount[0].quantity,
      DEFAULT_CAMPAIGN_COLLATERAL.toString(),
    );
  });

  it("Step 7: Voter 1 reclaims all 64 $FEED tokens after vote ticket expiry", () => {
    const txBuilder = new MeshTxBuilder();

    buildReclaimVoteTicketTx(txBuilder, contracts, {
      voterAddress: voter1Address,
      voterKeyHash: voter1Pkh,
      utxos: [
        {
          input: {
            txHash: "5656565656565656565656565656565656565656565656565656565656565656",
            outputIndex: 0,
          },
          output: {
            address: voter1Address,
            amount: [{ unit: "lovelace", quantity: "10000000" }],
          },
        },
      ],
      collateralUtxo,
      ticketUtxo: voter1TicketUtxo,
      ticketDatum: voter1TicketDatum,
    });

    flushTx(txBuilder);
    const body = txBuilder.meshTxBuilderBody;

    // 1. Spends ticket script UTxO
    assert.strictEqual(body.inputs.length, 1);
    assert.strictEqual(body.inputs[0].txIn.txHash, voter1TicketUtxo.input.txHash);

    // 2. Validity range strictly after ticket expiry
    assert.strictEqual(body.validityRange.invalidBefore, deadlinePosixTime + 1);

    // 3. Voter signature required
    assert.ok(body.requiredSignatures.includes(voter1Pkh));

    // 4. All assets (64 $FEED + 2 ADA) returned to voter
    assert.strictEqual(body.outputs[0].address, voter1Address);
    assert.deepStrictEqual(body.outputs[0].amount, voter1TicketUtxo.output.amount);
  });

  it("Step 8: Staker unstakes 50 ADA from Treasury and burns 50 $FEED tokens", () => {
    const unstakeAmount = 50_000_000; // 50 ADA
    const txBuilder = new MeshTxBuilder();

    // Latest Treasury state
    const currentTreasuryUtxo = {
      input: {
        txHash: "7878787878787878787878787878787878787878787878787878787878787878",
        outputIndex: 0,
      },
      output: {
        address: contracts.treasury.address,
        amount: [{ unit: "lovelace", quantity: treasuryLovelace.toString() }],
      },
    };

    buildUnstakeTreasuryTx(txBuilder, contracts, {
      walletAddress: stakerAddress,
      utxos: [
        {
          input: {
            txHash: "9090909090909090909090909090909090909090909090909090909090909090",
            outputIndex: 0,
          },
          output: {
            address: stakerAddress,
            amount: [
              { unit: "lovelace", quantity: "20000000" },
              {
                unit: contracts.feedPolicyId + FEED_TOKEN_NAME_HEX,
                quantity: unstakeAmount.toString(),
              },
            ],
          },
        },
      ],
      collateralUtxo,
      treasuryUtxo: currentTreasuryUtxo,
      currentDatum: currentTreasuryDatum,
      unstakeLovelace: unstakeAmount,
    });

    flushTx(txBuilder);
    const body = txBuilder.meshTxBuilderBody;

    // 1. Spends Treasury script UTxO
    assert.strictEqual(body.inputs.length, 1);

    // 2. Burns 50 $FEED tokens (negative mint amount)
    assert.strictEqual(body.mints.length, 1);
    assert.strictEqual(body.mints[0].policyId, contracts.feedPolicyId);
    assert.strictEqual(body.mints[0].mintValue[0].amount, (-unstakeAmount).toString());

    // 3. Staker receives 50 ADA back
    assert.strictEqual(body.outputs[1].address, stakerAddress);
    assert.strictEqual(body.outputs[1].amount[0].quantity, unstakeAmount.toString());

    // 4. Continuing Treasury total staked decreased by 50 ADA
    const nextTotal = treasuryLovelace - unstakeAmount;
    assert.strictEqual(body.outputs[0].address, contracts.treasury.address);
    assert.strictEqual(body.outputs[0].amount[0].quantity, nextTotal.toString());
  });
});
