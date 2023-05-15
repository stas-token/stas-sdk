const bsv = require('bsv')
const utility = require('./utility')
const stasUtils = require('./stasTemplates')
const errorHandler = require('./errors')
const feeEstimates = require('./stasFeeEstimates')

// STAS merge
/**
 * @param {string} ownerPublicKey1 - public key string of the first input UTXO
 * @param {object} stasInput1 - contains the output index and the transaction hex value of the first input - {txHex : string, vout : number}
 * @param {string} ownerPublicKey2  - public key string of the first input UTXO
 * @param {object} stasInput2 - contains the output index and the transaction hex value of the second input - {txHex : string, vout : number}
 * @param {string} destinationAddr - address where the token is being sent to in the transaction
 * @param {string} paymentPublicKey - payment public key string.
 * @param {object} paymentUtxo - utxo that is provided to pay the transaction fee.
 * @param {string} data - optional data field that can be used for certain STAS token templates
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @param {object} ownerPrivateKey1  - private key value for the first stas token input
 * @param {object} ownerPrivateKey2 - private key value for the second stas token input
 * @param {object} paymentPrivateKey - private key for the paymentUtxo
 * @param {number} txCost - total cost of the transaction in satoshis based on the fee rate from the BSV libary
 * @param {boolean} feeEstimateCall - if true will bypass the isZeroChange error handling as it would be called only to return the transaction fee estimate
 * @return {Promise<string|object>} - Will return one of two options.
 *  - If all private keys are supplied for all inputs, resolves with the signed transaction in hexadecimal format.
 *  - If not all private keys are supplied to sign the transaction, resolves with an object containing information about the unsigned input(s) along with the transaction.
 */
async function unSignedFunc(ownerPublicKey1, stasInput1, ownerPublicKey2, stasInput2, destinationAddr, paymentPublicKey, paymentUtxo, data, isZeroChange = false, ownerPrivateKey1, ownerPrivateKey2, paymentPrivateKey, txCost, feeEstimateCall = false) {
  errorHandler.validateMergeArgs(ownerPublicKey1, stasInput1, ownerPublicKey2, stasInput2, destinationAddr, paymentPublicKey, paymentUtxo);

  const unsignedData = [];
  const isZeroFee = (!paymentUtxo);

  const stasTx1 = new bsv.Transaction(stasInput1.txHex).toObject();
  const stasTx2 = new bsv.Transaction(stasInput2.txHex).toObject();

  const stasUtxo1 = {
    txid: stasTx1.hash,
    vout: stasInput1.vout,
    script: stasTx1.outputs[stasInput1.vout].script,
    satoshis: stasTx1.outputs[stasInput1.vout].satoshis,
  };

  const stasUtxo2 = {
    txid: stasTx2.hash,
    vout: stasInput2.vout,
    script: stasTx2.outputs[stasInput2.vout].script,
    satoshis: stasTx2.outputs[stasInput2.vout].satoshis,
  };

  const lockingScriptPart = stasUtxo1.script.slice(46);
  const stasAmount = stasUtxo1.satoshis + stasUtxo2.satoshis;
  const destinationPubkeyHash = utility.addressToPKH(destinationAddr);
  const stasScript = stasUtils.updateStasScript(destinationPubkeyHash, stasUtxo1.script);
  const isStas20 = stasUtils.checkIfStas20(stasScript);
  const redeemAddress = stasUtils.getRedeemPublicKeyHash(stasScript);
  const paymentPublicKeyHash = utility.getPKHfromPublicKey(paymentPublicKey);
  errorHandler.checkDestinationAddressCondition(redeemAddress, destinationPubkeyHash, isStas20);

  const stas1parts = utility.replaceSubstring(stasInput1.txHex, lockingScriptPart, ' ').split(' ');
  stasUtxo1.scriptPiece = stas1parts.reverse().join(' ');
  stasUtxo1.pieceCount = stas1parts.length;

  const stas2parts = utility.replaceSubstring(stasInput2.txHex, lockingScriptPart, ' ').split(' ');
  stasUtxo2.scriptPiece = stas2parts.reverse().join(' ');
  stasUtxo2.pieceCount = stas2parts.length;

  const outputData = [{publicKeyHash: destinationPubkeyHash}];

  const tx = new bsv.Transaction();
  tx.from([stasUtxo1, stasUtxo2]);

  if (!isZeroFee) {
    tx.from(paymentUtxo);
  }
  tx.addOutput(new bsv.Transaction.Output({
    script: stasScript,
    satoshis: Math.floor(stasAmount),
  }));

  if (!isZeroFee && !isZeroChange) {
    tx.addOutput(new bsv.Transaction.Output({
      script: utility.buildP2pkhOutputScript(paymentPublicKeyHash),
      satoshis: paymentUtxo.satoshis - txCost,
    }));
    outputData.push({publicKeyHash: paymentPublicKeyHash});
  }

  if (isZeroChange && !feeEstimateCall) {
    errorHandler.checkZeroChangeThreshold(paymentUtxo.satoshis, txCost, 'Merge Function Zero Change');
  }

  if (isStas20 && data !== undefined) {
    data = stasUtils.formatDataToHex(data);
    const lockingScriptNote = '006a' + data;
    tx.addOutput(new bsv.Transaction.Output({
      script: lockingScriptNote,
      satoshis: 0,
    }));
  }


  const input1Preimage = bsv.Transaction.Sighash.sighashPreimage(tx, utility.SIGHASH, 0, tx.inputs[0].output.script, tx.inputs[0].output.satoshisBN).toString('hex');
  const input2Preimage = bsv.Transaction.Sighash.sighashPreimage(tx, utility.SIGHASH, 1, tx.inputs[1].output.script, tx.inputs[1].output.satoshisBN).toString('hex');


  const unSignedUnlockingScript1 = await stasUtils.buildMergeUnlockingScript(tx, stasUtxo2, outputData, input1Preimage, paymentUtxo, isStas20, data, isZeroChange, isZeroFee);
  if (ownerPrivateKey1) {
    tx.inputs[0].setScript(bsv.Script.fromASM(`${unSignedUnlockingScript1} ${bsv.Transaction.sighash.sign(tx, ownerPrivateKey1, utility.SIGHASH, 0, tx.inputs[0].output._script, tx.inputs[0].output._satoshisBN).toTxFormat().toString('hex')} ${ownerPublicKey1}`));
  } else {
    tx.inputs[0].setScript(bsv.Script.fromASM(`${unSignedUnlockingScript1}`));
    unsignedData.push({inputIndex: 0, satoshis: tx.inputs[0].output._satoshisBN, script: tx.inputs[0].output._script, sighash: utility.SIGHASH, publicKeyString: ownerPublicKey1, stas: true});
  }

  const unSignedUnlockingScript2 = await stasUtils.buildMergeUnlockingScript(tx, stasUtxo1, outputData, input2Preimage, paymentUtxo, isStas20, data, isZeroChange, isZeroFee);
  if (ownerPrivateKey2) {
    tx.inputs[1].setScript(bsv.Script.fromASM(`${unSignedUnlockingScript2} ${bsv.Transaction.sighash.sign(tx, ownerPrivateKey2, utility.SIGHASH, 1, tx.inputs[1].output._script, tx.inputs[1].output._satoshisBN).toTxFormat().toString('hex')} ${ownerPublicKey2}`));
  } else {
    tx.inputs[1].setScript(bsv.Script.fromASM(`${unSignedUnlockingScript2}`));
    unsignedData.push({inputIndex: 1, satoshis: tx.inputs[1].output._satoshisBN, script: tx.inputs[1].output._script, sighash: utility.SIGHASH, publicKeyString: ownerPublicKey2, stas: true});
  }

  if (!isZeroFee) {
    if (paymentPrivateKey) {
      tx.inputs[2].setScript(bsv.Script.fromASM(`${bsv.Transaction.sighash.sign(tx, paymentPrivateKey, utility.SIGHASH, 2, tx.inputs[2].output._script, tx.inputs[2].output._satoshisBN).toTxFormat().toString('hex')} ${paymentPublicKey}`));
    } else {
      unsignedData.push({inputIndex: 2, satoshis: tx.inputs[2].output._satoshisBN, script: tx.inputs[2].output._script, sighash: utility.SIGHASH, publicKeyString: paymentPublicKey, stas: false});
    }
  }

  if (unsignedData.length) {
    return {
      unsignedData: unsignedData,
      tx: tx,
    };
  } else {
    return tx.serialize(true);
  }
}

/**
 * Will create a new signed transaction for a token merge.
 * @param {object} ownerPrivateKey1  - private key value for the first stas token input
 * @param {object} stasInput1 - contains the output index and the transaction hex value of the first input - {txHex : string, vout : number}
 * @param {object} ownerPrivateKey2 - private key value for the second stas token input
 * @param {object} stasInput2 - contains the output index and the transaction hex value of the second input - {txHex : string, vout : number}
 * @param {string} destinationAddr - address where the token is being sent to in the transaction
 * @param {object} paymentPrivateKey - private key for the paymentUtxo
 * @param {object} paymentUtxo - utxo that is provided to pay the transaction fee.
 * @param {string} data - optional data field that can be used for certain STAS token templates
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @param {number} txCost - total cost of the transaction in satoshis based on the fee rate from the BSV libary
 * @param {boolean} feeEstimateCall - if true will bypass the isZeroChange error handling as it would be called only to return the transaction fee estimate
 * @return {Promise<string>} - will return a promise that contains the signed transaction in hexadecimal format
 */
async function signedFunc(ownerPrivateKey1, stasInput1, ownerPrivateKey2, stasInput2, destinationAddr, paymentPrivateKey, paymentUtxo, data, isZeroChange, txCost, feeEstimateCall) {
  return await unSignedFunc(bsv.PublicKey.fromPrivateKey(ownerPrivateKey1).toString(), stasInput1, bsv.PublicKey.fromPrivateKey(ownerPrivateKey2).toString(), stasInput2, destinationAddr, bsv.PublicKey.fromPrivateKey(paymentPrivateKey).toString(), paymentUtxo, data, isZeroChange, ownerPrivateKey1, ownerPrivateKey2, paymentPrivateKey, txCost, feeEstimateCall);
}

/**
 * Will return a fee estimate for the token merge transaction.
 * @param {object} stasInput1 - contains the output index and the transaction hex value of the first input - {txHex : string, vout : number}
 * @param {object} stasInput2 - contains the output index and the transaction hex value of the second input - {txHex : string, vout : number}
 * @param {string} data - optional data field that can be used for certain STAS token templates
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @return {Promise<number>} - will return a number that will be the fee estimate for the transaction
 */
async function feeEstimate(stasInput1, stasInput2, data, isZeroChange) {
  const mergeHex = await signedFunc(feeEstimates.templatePrivateKey, stasInput1, feeEstimates.templatePrivateKey, stasInput2, feeEstimates.templateAddress, feeEstimates.templatePrivateKey, feeEstimates.paymentUtxoTemplate, data, isZeroChange, feeEstimates.txCost, true);
  return new bsv.Transaction(mergeHex).feePerKb(utility.SATS)._estimateFee();
}

/**
 * Will create a new signed transaction for a token merge.
 * @param {object} ownerPrivateKey1  - private key value for the first stas token input
 * @param {object} stasInput1 - contains the output index and the transaction hex value of the first input - {txHex : string, vout : number}
 * @param {object} ownerPrivateKey2 - private key value for the second stas token input
 * @param {object} stasInput2 - contains the output index and the transaction hex value of the second input - {txHex : string, vout : number}
 * @param {string} destinationAddr - address where the token is being sent to in the transaction
 * @param {object} paymentPrivateKey - private key for the paymentUtxo
 * @param {object} paymentUtxo - utxo that is provided to pay the transaction fee.
 * @param {string} data - optional data field that can be used for certain STAS token templates
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @return {Promise<string>} - will return a promise that contains the signed transaction in hexadecimal format
 */
async function signed(ownerPrivateKey1, stasInput1, ownerPrivateKey2, stasInput2, destinationAddr, paymentPrivateKey, paymentUtxo, data, isZeroChange) {
  const txCost = await feeEstimate(stasInput1, stasInput2, data, isZeroChange);
  return await signedFunc(ownerPrivateKey1, stasInput1, ownerPrivateKey2, stasInput2, destinationAddr, paymentPrivateKey, paymentUtxo, data, isZeroChange, txCost);
}

/**
 * Will create a new unSigned transaction for a token merge.
 * @param {string} ownerPublicKey1 - public key string of the first input UTXO
 * @param {object} stasInput1 - contains the output index and the transaction hex value of the first input - {txHex : string, vout : number}
 * @param {string} ownerPublicKey2  - public key string of the first input UTXO
 * @param {object} stasInput2 - contains the output index and the transaction hex value of the second input - {txHex : string, vout : number}
 * @param {string} destinationAddr - address where the token is being sent to in the transaction
 * @param {string} paymentPublicKey - payment public key string.
 * @param {object} paymentUtxo - utxo that is provided to pay the transaction fee.
 * @param {string} data - optional data field that can be used for certain STAS token templates
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @return {Promise<object>} - will return a promise containing the information about the unsigned input(s) along with the transaction
 */
async function unSigned(ownerPublicKey1, stasInput1, ownerPublicKey2, stasInput2, destinationAddr, paymentPubKey, paymentUtxo, data, isZeroChange) {
  const txCost = await feeEstimate(stasInput1, stasInput2, data, isZeroChange);
  return await unSignedFunc(ownerPublicKey1, stasInput1, ownerPublicKey2, stasInput2, destinationAddr, paymentPubKey, paymentUtxo, data, isZeroChange, undefined, undefined, undefined, txCost);
}

module.exports =  {signed, unSigned, feeEstimate}

  