const bsv = require('bsv')
const { stasAcceptSwap, stasTransfer , stasIssuance, stasContract, stasSplit, stasRedeem, stasRedeemSplit, stasMerge , stasMergeSplit, stasCreateSwap, utility, tokenSchemaTemplate} = require('../index');

/**
 * This file will use template UTXOs and example private keys to run full cycle tests for signed transactions. This is for demonstration purposes only.
 * In this example we will mint a STAS token using mock UTXO data. It will work in the same way as real UTXOs but in this case the transactions will not be broadcasted to the network.
 * The token will utilize the templates provided for the tokenSchema and also the issueData. We will create 10 tokens then run through all signed versions of the functions to provide a full cycle.
 *
 */
// issuerPrivateKey - Private key used for issuing the STAS token
const issuerPrivateKey = bsv.PrivateKey.fromString('KzBA5L1cwFkr3FDd7jW3V1JsHKVqQcrPztG9Bx49f1fa6faM1ESX');
const issuerAddress = bsv.Address.fromPrivateKey(issuerPrivateKey).toString();

// tokenOwnerPrivateKey - Private key of STAS token owner after the issuance
const tokenOwnerPrivateKey = bsv.PrivateKey.fromString('KwcpcqTyGijGdVRjazx9a6nanwJtd4caRKPyfAcxLLbb96z8Phdm');
const tokenOwnerAddress = bsv.Address.fromPrivateKey(tokenOwnerPrivateKey).toString();

// paymentPrivateKey - Private key used for the fee UTXO
const paymentPrivateKey = bsv.PrivateKey.fromString('L5MgGTPJRMqHyUX5UsD4JWMwMUFGdFwVL73vvcRmuPhVD1Avzugr');

const utxoTemplateForContract = {
  txid: '1234567890123456789012345678901234567890123456789012345678901234',
  vout: 0,
  satoshis: 200,
  script: '76a914c8e5f1437d5dbca99f82f20d6c5f03a012a5482688ac',
};
const utxoTemplateForFees = {
  txid: '1234567890123456789012345678901234567890123456789012345678901234',
  vout: 0,
  satoshis: 100000,
  script: '76a914c8e5f1437d5dbca99f82f20d6c5f03a012a5482688ac',
};

// Token is issued to the tokenOwnerAddress
const issueData = [{
  addr: tokenOwnerAddress, // address the token is being issued to
  satoshis: 10, // amount of satoshis of the STAS token the address is receiving
  data: ['STAS TOKEN TESTING'], // token meta data add to the end of the script in OP_RETURN
}];

const fullCycleTestNonBroadcast = async () => {
  console.log('Start Full Cycle Non Broadcast Test...');

  // Create a contract transaction of the token. Will create a token contract for a supply of 10 tokens.
  const contractTx = await stasContract.signed(issuerPrivateKey, utxoTemplateForContract, utxoTemplateForFees, paymentPrivateKey, tokenSchemaTemplate, 10);
  console.log('Contract Transaction Hex: ', contractTx.toString());
  const contractUtxo = utility.getUtxoFromTx(contractTx, 0);


  // Issue the token from the contract UTXO. This will be a STAS-20 token type.
  const issueTx = await stasIssuance.signed(issuerPrivateKey, issueData, contractUtxo, utxoTemplateForFees, paymentPrivateKey, true, tokenSchemaTemplate.symbol, 'STAS-20');
  console.log('Issue Transaction Hex: ', issueTx.toString());
  const tokenUtxoFromIssuance = utility.getUtxoFromTx(issueTx, 0);


  // Transfer the token to the same owner address.
  const transferTx1 = await stasTransfer.signed(tokenOwnerPrivateKey, tokenUtxoFromIssuance, tokenOwnerAddress, utxoTemplateForFees, paymentPrivateKey );
  console.log('Transfer1 Transaction Hex: ', transferTx1.toString());
  const tokenUtxoFromTransfer1 = utility.getUtxoFromTx(transferTx1, 0);


  // Split the token into two UTXOs of 5 satoshis each
  const splitDestinationsForSplitTx1 = [{address: tokenOwnerAddress, satoshis: 5}, {address: tokenOwnerAddress, satoshis: 5}];
  const splitTx1 = await stasSplit.signed(tokenOwnerPrivateKey, tokenUtxoFromTransfer1, splitDestinationsForSplitTx1, utxoTemplateForFees, paymentPrivateKey );
  console.log('Split1 Transaction Hex: ', splitTx1.toString());


  // Merge the two 5 satoshi tokens back into a single UTXO. For this we require the whole previous transaction hex and vout value for both STAS UTXO inputs.
  const stasData1 = {txHex: splitTx1.toString(), vout: 0};
  const stasData2 = {txHex: splitTx1.toString(), vout: 1};
  const mergeHex = await stasMerge.signed(tokenOwnerPrivateKey, stasData1, tokenOwnerPrivateKey, stasData2, tokenOwnerAddress, paymentPrivateKey, utxoTemplateForFees);
  console.log('Merge Transaction Hex: ', mergeHex.toString());
  const tokenUtxoFromMergeTx = utility.getUtxoFromTx(mergeHex, 0);


  // Split the token into two UTXOs one of 9 satoshis and one of 1 satoshi
  const splitDestinationsForSplitTx2 = [{address: tokenOwnerAddress, satoshis: 9}, {address: tokenOwnerAddress, satoshis: 1}];
  const splitTx2 = await stasSplit.signed(tokenOwnerPrivateKey, tokenUtxoFromMergeTx, splitDestinationsForSplitTx2, utxoTemplateForFees, paymentPrivateKey );
  console.log('Split2 Transaction Hex: ', splitTx2.toString());


  // MergeSplit will take two UTXO inputs and then allow it to be split into more than one output. We will merge the UTXOs of 9 satoshi and 1 satoshis and create two new outputs with 2 satoshis and 8 satoshis
  const stasData3 = {txHex: splitTx2.toString(), vout: 0};
  const stasData4 = {txHex: splitTx2.toString(), vout: 1};
  const splitDestinationsForMergeSplitTx = [{address: tokenOwnerAddress, satoshis: 2}, {address: tokenOwnerAddress, satoshis: 8}];
  const mergeSplitHex = await stasMergeSplit.signed(tokenOwnerPrivateKey, stasData3, tokenOwnerPrivateKey, stasData4, splitDestinationsForMergeSplitTx, paymentPrivateKey, utxoTemplateForFees);
  console.log('MergeSplit Transaction Hex: ', mergeSplitHex.toString());
  const tokenUtxosFromMergeSplitTx = [utility.getUtxoFromTx(mergeSplitHex, 0), utility.getUtxoFromTx(mergeSplitHex, 1)];


  // We will transfer the first token UTXO from the mergeSplit transaction to the same owner address
  const transferTx2 = await stasTransfer.signed(tokenOwnerPrivateKey, tokenUtxosFromMergeSplitTx[0], tokenOwnerAddress, utxoTemplateForFees, paymentPrivateKey);
  console.log('Transfer2 Transaction Hex: ', transferTx2.toString());
  const tokenUtxoFromTransfer2 = utility.getUtxoFromTx(transferTx2, 0);


  // We will transfer the second token UTXO from the mergeSplit transaction to the same owner address
  const transferHex3 = await stasTransfer.signed(tokenOwnerPrivateKey, tokenUtxosFromMergeSplitTx[1], tokenOwnerAddress, utxoTemplateForFees, paymentPrivateKey);
  console.log('Transfer3 Transaction Hex: ', transferHex3.toString());
  const tokenUtxoFromTransfer3 = utility.getUtxoFromTx(transferHex3, 0);


  // Here we will create an offer transaction hex to be used in an atomic swap. For this we will just swap one STAS token UTXO for another.
  // This example will take the STAS UTXO from the transferTx2 transaction and create an offer to swap it for the transactionHex3 transaction STAS UTXO
  const wantedDataForCreateSwap = {satoshis: tokenUtxoFromTransfer3.satoshis, script: tokenUtxoFromTransfer3.script};
  const offerTx = await stasCreateSwap.signed(tokenOwnerPrivateKey, tokenUtxoFromTransfer2, wantedDataForCreateSwap);
  console.log('Offer Transaction Hex: ', offerTx.toString());


  // We will now complete the swap by adding in all remaining parameters required to call the stasAcceptSwap function
  const swapTx = await stasAcceptSwap.signed(offerTx, tokenOwnerPrivateKey, transferTx2, transferHex3, tokenUtxoFromTransfer3.vout, paymentPrivateKey, utxoTemplateForFees);
  console.log('Swap Transaction Hex: ', swapTx.toString());


  // Here we will now merge the two STAS UTXOs from the atomic swap into a single 10 satoshi STAS UTXO
  const stasData5 = {txHex: swapTx.toString(), vout: 0};
  const stasData6 = {txHex: swapTx.toString(), vout: 1};
  const mergeTx2 = await stasMerge.signed(tokenOwnerPrivateKey, stasData5, tokenOwnerPrivateKey, stasData6, tokenOwnerAddress, paymentPrivateKey, utxoTemplateForFees);
  console.log('Merge2 Transaction Hex: ', mergeTx2.toString());
  const tokenUtxoFromMergeTx2 = utility.getUtxoFromTx(mergeTx2, 0);


  // Here we are now transferring the token to the issuer address. This is required for the STAS-20 token as only the issuer is allowed to redeem the token.
  const transferTx4 = await stasTransfer.signed(tokenOwnerPrivateKey, tokenUtxoFromMergeTx2, issuerAddress, utxoTemplateForFees, paymentPrivateKey);
  console.log('Transfer4 Transaction Hex: ', transferTx4.toString());
  const tokenUtxoFromTransfer4 = utility.getUtxoFromTx(transferTx4, 0);


  // Now we will create the redeem split transaction. This allows for only a portion of the UTXO to be redeemed and the remainder will go to other outputs as STAS TOKENS. In this case we will redeem 5 of the 10 tokens and leave 5 as a remainder.
  // Note that the first output will always be the p2pkh redemption output which will be the conversion back to native satoshis
  const splitDestinationsForRedeemSplit = [{address: issuerAddress, satoshis: 5}];
  const redeemSplitTx = await stasRedeemSplit.signed(issuerPrivateKey, tokenUtxoFromTransfer4, splitDestinationsForRedeemSplit, utxoTemplateForFees, paymentPrivateKey);
  console.log('RedeemSplit Transaction Hex: ', redeemSplitTx.toString());
  const tokenUtxosFromRedeemSplitTx = utility.getUtxoFromTx(redeemSplitTx, 1);


  // Now we will redeem the final STAS UTXO back to native satoshis which completes the full cycle.
  const redeemTx = await stasRedeem.signed(issuerPrivateKey, tokenUtxosFromRedeemSplitTx, utxoTemplateForFees, paymentPrivateKey);
  console.log('Redeem Transaction Hex: ', redeemTx.toString());

  console.log('Full Cycle Non Broadcast Test Completed');
};

fullCycleTestNonBroadcast();