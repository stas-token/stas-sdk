const bsv = require('bsv')
const utility = require('./utility')
const stasUtils = require('./stasTemplates')
const errorHandler = require('./errors')
const feeEstimates = require('./stasFeeEstimates')


// STAS Redeem
/**
 * @param {string} ownerPublicKey - public key string for the STAS UTXO
 * @param {object} stasUtxo - STAS token UTXO to be redeemed
 * @param {string} paymentPublicKey - payment public key string.
 * @param {object} paymentUtxo - utxo that is provided to pay the transaction fee.
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
async function unSignedFunc(ownerPublicKey, stasUtxo, paymentPublicKey, paymentUtxo, data, isZeroChange = false, ownerPrivateKey, paymentPrivateKey, txCost, feeEstimateCall = false) {
    errorHandler.validateRedeemArgs(ownerPublicKey, stasUtxo, paymentPublicKey, paymentUtxo);
    const unsignedData = [];
  
    const isStas20 = stasUtils.checkIfStas20(stasUtxo.script);
    const isStas789 = stasUtils.checkIfStas789(stasUtxo.script);
    const paymentPublicKeyHash = utility.getPKHfromPublicKey(paymentPublicKey);
    const redeemPkh = stasUtils.getRedeemPublicKeyHash(stasUtxo.script);
    const redeemOutputScript = utility.buildP2pkhOutputScript(redeemPkh);
  
  
    const isZeroFee = (!paymentUtxo);
  
    const tx = new bsv.Transaction();
    tx.from(stasUtxo);
    if (!isZeroFee) {
      tx.from(paymentUtxo);
    }
  
    tx.addOutput(new bsv.Transaction.Output({
      script: redeemOutputScript,
      satoshis: stasUtxo.satoshis,
    }));
  
    const outputData = [{
      satoshis: stasUtxo.satoshis,
      publicKeyHash: redeemPkh,
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
      errorHandler.checkZeroChangeThreshold(paymentUtxo.satoshis, txCost, 'Redeem Function Zero Change');
    }
  
    if (isStas20 && data !== undefined) {
      data = stasUtils.formatDataToHexStringWithOpCodeConversion(data);
      const lockingScriptNote = '006a' + data;
      tx.addOutput(new bsv.Transaction.Output({
        script: lockingScriptNote,
        satoshis: 0,
      }));
    }
  
    const unSignedUnlockingScript = await stasUtils.buildUnlockingScriptUnsigned(tx, outputData, isStas789, isStas20, data, isZeroFee, isZeroChange);
    if (ownerPrivateKey) {
      tx.inputs[0].setScript(bsv.Script.fromASM(`${unSignedUnlockingScript} ${bsv.Transaction.Sighash.sign(tx, ownerPrivateKey, utility.SIGHASH, 0, tx.inputs[0].output._script, tx.inputs[0].output._satoshisBN).toTxFormat().toString('hex')} ${ownerPublicKey}`));
    } else {
      tx.inputs[0].setScript(bsv.Script.fromASM(`${unSignedUnlockingScript}`));
      unsignedData.push({inputIndex: 0, satoshis: tx.inputs[0].output._satoshisBN, script: tx.inputs[0].output._script, sighash: utility.SIGHASH, publicKeyString: ownerPublicKey, stas: true});
    }
  
    if (!isZeroFee) {
      if (paymentPrivateKey) {
        tx.inputs[1].setScript(bsv.Script.fromASM(`${bsv.Transaction.Sighash.sign(tx, paymentPrivateKey, utility.SIGHASH, 1, tx.inputs[1].output._script, tx.inputs[1].output._satoshisBN).toTxFormat().toString('hex')} ${paymentPublicKey}`));
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
      return tx.serialize(true);
    }
}
  
/**
 * Will create a new signed transaction for a token redeem.
 * @param {object} ownerPrivateKey - private key value for the STAS UTXO
 * @param {object} stasUtxo - STAS token UTXO to be redeemed
 * @param {object} paymentUtxo - utxo that is provided to pay the transaction fee.
 * @param {object} paymentPrivateKey - private key for the paymentUtxo
 * @param {string} data - optional data field that can be used for certain STAS token templates
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @param {number} txCost - total cost of the transaction in satoshis based on the fee rate from the BSV libary
 * @param {boolean} feeEstimateCall - if true will bypass the isZeroChange error handling as it would be called only to return the transaction fee estimate
 * @return {Promise<string>} - will return a promise that contains the signed transaction in hexadecimal format
 */
function signedFunc(ownerPrivateKey, stasUtxo, paymentUtxo, paymentPrivateKey, data, isZeroChange, txCost, feeEstimateCall ) {
    return unSignedFunc(bsv.PublicKey.fromPrivateKey(ownerPrivateKey).toString(), stasUtxo, bsv.PublicKey.fromPrivateKey(paymentPrivateKey).toString(), paymentUtxo, data, isZeroChange, ownerPrivateKey, paymentPrivateKey, txCost, feeEstimateCall);
}
  
/**
 * Will return a fee estimate for the token redeem transaction.
 * @param {object} stasUtxo - STAS token UTXO to be redeemed
 * @param {string} data - optional data field that can be used for certain STAS token templates
 * @param {*} isZeroChange
 * @return {Promise<number>} - will return a number that will be the fee estimate for the transaction
 */
async function feeEstimate(stasUtxo, data, isZeroChange) {
    const redeemHex = await signedFunc(feeEstimates.templatePrivateKey, stasUtxo, feeEstimates.paymentUtxoTemplate, feeEstimates.templatePrivateKey, data, isZeroChange, feeEstimates.txCost, true);
    return new bsv.Transaction(redeemHex).feePerKb(utility.SATS)._estimateFee();
}
  
/**
 * Will create a new signed transaction for a token redeem.
 * @param {object} ownerPrivateKey - private key value for the STAS UTXO
 * @param {object} stasUtxo - STAS token UTXO to be redeemed
 * @param {object} paymentUtxo - utxo that is provided to pay the transaction fee.
 * @param {object} paymentPrivateKey - private key for the paymentUtxo
 * @param {string} data - optional data field that can be used for certain STAS token templates
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @return {Promise<string>} - will return a promise that contains the signed transaction in hexadecimal format
 */
async function signed(ownerPrivateKey, stasUtxo, paymentUtxo, paymentPrivateKey, data, isZeroChange) {
    const txCost = await feeEstimate(stasUtxo, data, isZeroChange);
    return await signedFunc(ownerPrivateKey, stasUtxo, paymentUtxo, paymentPrivateKey, data, isZeroChange, txCost);
}
  
/**
 * Will create a new unSigned transaction for a token redeem.
 * @param {string} ownerPublicKey - public key string for the STAS UTXO
 * @param {object} stasUtxo - STAS token UTXO to be redeemed
 * @param {string} paymentPublicKey - payment public key string.
 * @param {object} paymentUtxo - utxo that is provided to pay the transaction fee.
 * @param {string} data - optional data field that can be used for certain STAS token templates
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @return {Promise<object>} - will return a promise containing the information about the unsigned input(s) along with the transaction
 */
async function unSigned(ownerPublicKey, stasUtxo, paymentPublicKey, paymentUtxo, data, isZeroChange) {
    const txCost = await feeEstimate(stasUtxo, data, isZeroChange);
    return await unSignedFunc(ownerPublicKey, stasUtxo, paymentPublicKey, paymentUtxo, data, isZeroChange, undefined, undefined, txCost);
}
  
module.exports =  {signed, unSigned, feeEstimate}