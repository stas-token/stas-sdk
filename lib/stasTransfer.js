const bsv = require('bsv')
const utility = require('./utility')
const stasUtils = require('./stasTemplates')
const errorHandler = require('./errors')
const feeEstimates = require('./stasFeeEstimates')

// STAS Transfer
/**
 * Main function that will build the STAS transfer transaction
 * @param {string} ownerPublicKey - public key string for the STAS UTXO
 * @param {object} stasUtxo - STAS token UTXO to be trasnferred
 * @param {string} destinationAddress - desintaion address string
 * @param {object} paymentUtxo - utxo that is provided to pay the transaction fee.
 * @param {string} paymentPublicKey - desination addresses and amounts for each output in the transaction
 * @param {string} data - optional data field that can be used for certain STAS token templates
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @param {object} ownerPrivateKey - private key value for the STAS UTXO
 * @param {object} paymentPrivateKey - private key for the paymentUtxo
 * @param {number} txCost - total cost of the transaction in satoshis based on the fee rate from the BSV libary
 * @param {boolean} feeEstimateCall - if true will bypass the isZeroChange error handling as it would be called only to return the transaction fee estimate
 * @return {Promise<string|object>} - Will return one of two options.
 *  - If all private keys are supplied for all inputs, resolves with the signed transaction in hexadecimal format.
 *  - If not all private keys are supplied to sign the transaction, resolves with an object containing information about the unsigned input(s) along with the transaction.
 */
async function unSignedFunc(ownerPublicKey, stasUtxo, destinationAddress, paymentUtxo, paymentPublicKey, data, isZeroChange, ownerPrivateKey, paymentPrivateKey, txCost, feeEstimateCall = false) {
  errorHandler.validateTranferArgs(ownerPublicKey, stasUtxo, destinationAddress, paymentUtxo, paymentPublicKey, data, isZeroChange, ownerPrivateKey, paymentPrivateKey);


  const isZeroFee = (!paymentUtxo);
  const destinationPublicKeyHash = utility.addressToPKH(destinationAddress);
  let stasScript = stasUtils.updateStasScript(destinationPublicKeyHash, stasUtxo.script);
  const isStas789 = stasUtils.checkIfStas789(stasScript);
  const isStas20 = stasUtils.checkIfStas20(stasScript);
  const paymentPublicKeyHash = utility.getPKHfromPublicKey(paymentPublicKey);
  if (isStas789 && data !== undefined) {
    data = stasUtils.formatDataToHexStringWithOpCodeConversion(data);
    stasScript = stasUtils.appendTokenData(stasScript, data);
  }

  const issuerPublicKeyHash = stasUtils.getRedeemPublicKeyHash(stasScript);
  errorHandler.checkDestinationAddressCondition(issuerPublicKeyHash, destinationPublicKeyHash, isStas20);

  const tx = new bsv.Transaction();

  tx.from(stasUtxo);
  if (!isZeroFee) tx.from(paymentUtxo);

  tx.addOutput(new bsv.Transaction.Output({
    script: stasScript,
    satoshis: stasUtxo.satoshis,
  }));

  const outputData = [{
    publicKeyHash: destinationPublicKeyHash,
    satoshis: stasUtxo.satoshis,
  }];


  if (!isZeroFee && !isZeroChange) {
    tx.addOutput(new bsv.Transaction.Output({
      script: utility.buildP2pkhOutputScript(paymentPublicKeyHash),
      satoshis: paymentUtxo.satoshis - txCost,
    }));
    outputData.push({
      satoshis: tx.outputs[1].satoshis,
      publicKeyHash: paymentPublicKeyHash,
    });
  }

  if (isZeroChange && !feeEstimateCall) {
    errorHandler.checkZeroChangeThreshold(paymentUtxo.satoshis, txCost, 'Transfer Function Zero Change');
  }

  if (isStas20 && data !== undefined) {
    data = stasUtils.formatDataToHexStringWithOpCodeConversion(data);
    const lockingScriptNote = '006a' + data;
    tx.addOutput(new bsv.Transaction.Output({
      script: lockingScriptNote,
      satoshis: 0,
    }));
  }

  const unsignedData = [];
  const unSignedUnlockingScript = await stasUtils.buildUnlockingScriptUnsigned(tx, outputData, isStas789, isStas20, data, isZeroFee, isZeroChange);
  if (ownerPrivateKey) {
    tx.inputs[0].setScript(bsv.Script.fromASM(`${unSignedUnlockingScript} ${bsv.Transaction.sighash.sign(tx, ownerPrivateKey, utility.SIGHASH, 0, tx.inputs[0].output._script, tx.inputs[0].output._satoshisBN).toTxFormat().toString('hex')} ${ownerPublicKey}`));
  } else {
    tx.inputs[0].setScript(bsv.Script.fromASM(`${unSignedUnlockingScript}`));
    unsignedData.push({inputIndex: 0, satoshis: tx.inputs[0].output._satoshisBN, script: tx.inputs[0].output._script, sighash: utility.SIGHASH, publicKeyString: ownerPublicKey, stas: true});
  }
  if (!isZeroFee) {
    if (paymentPrivateKey) {
      tx.inputs[1].setScript(bsv.Script.fromASM(`${bsv.Transaction.sighash.sign(tx, paymentPrivateKey, utility.SIGHASH, 1, tx.inputs[1].output._script, tx.inputs[1].output._satoshisBN).toTxFormat().toString('hex')} ${paymentPublicKey}`));
    } else {
      unsignedData.push({inputIndex: 1, satoshis: tx.inputs[1].output._satoshisBN, script: tx.inputs[1].output._script, sighash: utility.SIGHASH, publicKeyString: paymentPublicKey, stas: false});
    }
  }

  if (unsignedData.length) {
    return {
      unsignedData: unsignedData,
      tx: tx,
    };
  } else {
    return tx
  }
}

/**
 *
 * @param {object} ownerPrivatekey - private key used to sign the STAS utxo
 * @param {object} stasUtxo - STAS token UTXO to be transferred
 * @param {string} destinationAddress - desintaion address string
 * @param {object} paymentUtxo - utxo that is provided to pay the transaction fee.
 * @param {object} paymentPrivateKey - private key used to sign the payment utxo
 * @param {string} data - optional data field that can be used for certain STAS token templates
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @param {number} txCost - total cost of the transaction in satoshis based on the fee rate from the BSV libary
 * @param {boolean} feeEstimateCall - if true will bypass the isZeroChange error handling as it would be called only to return the transaction fee estimate
 * @return {Promise<string>} - will return a promise that contains the signed transaction in hexadecimal format
 */
async function signedFunc(ownerPrivatekey, stasUtxo, destinationAddress, paymentUtxo, paymentPrivateKey, data, isZeroChange, txCost, feeEstimateCall) {
  return await unSignedFunc(bsv.PublicKey.fromPrivateKey(ownerPrivatekey).toString(), stasUtxo, destinationAddress, paymentUtxo, bsv.PublicKey.fromPrivateKey(paymentPrivateKey).toString(), data, isZeroChange, ownerPrivatekey, paymentPrivateKey, txCost, feeEstimateCall);
}

/**
 * Will return the fee estimate for the stasTransfer function
 * @param {object} stasUtxo - STAS token UTXO to get a transfer fee estimate for
 * @param {string} data - optional data field that can be used for certain STAS token templates
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @return {Promise<number>} - will return a number that will be the fee estimate for the transaction
 */
async function feeEstimate(stasUtxo, data, isZeroChange) {
  const transferHex = await signedFunc(feeEstimates.templatePrivateKey, stasUtxo, feeEstimates.templateAddress, feeEstimates.paymentUtxoTemplate, feeEstimates.templatePrivateKey, data, isZeroChange, feeEstimates.txCost, true);
  return new bsv.Transaction(transferHex).feePerKb(utility.SATS)._estimateFee();
}

/**
 * Will create a new signed transaction for a token transfer.
 * @param {object} ownerPrivatekey - private key used to sign the STAS utxo
 * @param {object} stasUtxo - STAS token UTXO to be transferred
 * @param {string} destinationAddress - desintaion address string
 * @param {object} paymentUtxo - utxo that is provided to pay the transaction fee.
 * @param {object} paymentPrivateKey - private key used to sign the payment utxo
 * @param {string} data - optional data field that can be used for certain STAS token templates
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @return {Promise<string>} - will return a promise that contains the signed transaction in hexadecimal format
 */
async function signed(ownerPrivatekey, stasUtxo, destinationAddress, paymentUtxo, paymentPrivateKey, data, isZeroChange) {
  const txCost = await feeEstimate(stasUtxo, data, isZeroChange);
  return await signedFunc(ownerPrivatekey, stasUtxo, destinationAddress, paymentUtxo, paymentPrivateKey, data, isZeroChange, txCost);
}

/**
 * Will create a new signed transaction for a token issuance.
 * @param {string} ownerPubKey - public key string for the STAS UTXO
 * @param {object} stasUtxo - STAS token UTXO to be transferred
 * @param {string} destinationAddress - desintaion address string
 * @param {object} paymentUtxo - utxo that is provided to pay the transaction fee.
 * @param {string} paymentPubKey - desination addresses and amounts for each output in the transaction
 * @param {string} data - optional data field that can be used for certain STAS token templates
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @return {Promise<object>} - will return a promise containing the information about the unsigned input(s) along with the transaction
 */
async function unSigned(ownerPubKey, stasUtxo, destinationAddress, paymentUtxo, paymentPubKey, data, isZeroChange) {
  const txCost = await feeEstimate(stasUtxo, data, isZeroChange);
  return await unSignedFunc(ownerPubKey, stasUtxo, destinationAddress, paymentUtxo, paymentPubKey, data, isZeroChange, undefined, undefined, txCost);
}

module.exports =  {signed, unSigned, feeEstimate}