const bsv = require('bsv')
const utility = require('./utility')
const stasUtils = require('./stasTemplates')
const errorHandler = require('./errors')
const feeEstimates = require('./stasFeeEstimates')

// STAS acceptSwap
// TODO: Add in support for data
/**
 * This function will complete an atomic swap transaction by providing the input required as requested by the offer hex as well as providing the fee input to cover the transaction fees. This function is handled by the "sign" and
 * "unSigned" functions below and will provide both signed and unSigned format responses.
 * @param {string} offerTxHex - transaction in hexadecimal string format representing the transaction
 * @param {string} takerPublicKey - the public key of the taker input that is referenced from the takerInputTxHex
 * @param {string} makerInputTxHex - whole transaction in hexadecimal format representing the input from the maker in the offerTxHex
 * @param {string} takerInputTxHex - whole transaction in hexadecimal format of the taker input UTXO provided for the atomic swap
 * @param {number} takerVout  - output index of the taker utxo being used as the input in the atomic swap transaction
 * @param {string} paymentPubKey - payment public key string
 * @param {object} paymentUtxo - utxo that is provided to pay the transaction fee
 * @param {array} additionalOutputs - a list of output information that will add more outputs to an atomic swap transaction
 * @param {string} data - optional data field that can be used for certain STAS token templates
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @param {object} ownerPrivateKey - private key for the taker utxo that is supplied based on takerInputTxHex and vout value
 * @param {object} paymentPrivateKey - private key for the paymentUtxo
 * @param {number} txCost - total cost of the transaction in satoshis based on the fee rate from the BSV libary
 * @param {boolean} feeEstimateCall - if true will bypass the isZeroChange error handling as it would be called only to return the transaction fee estimate
 * @return {Promise<string|object>} - Will return one of two options.
 *  - If all private keys are supplied for all inputs, resolves with the signed transaction in hexadecimal format.
 *  - If not all private keys are supplied to sign the transaction, resolves with an object containing information about the unsigned input(s) along with the transaction.
*/
async function unSignedFunc(offerTxHex, takerPublicKey, makerInputTxHex, takerInputTxHex, takerVout, paymentPubKey, paymentUtxo, additionalOutputs, data, isZeroChange, ownerPrivateKey, paymentPrivateKey, txCost, feeEstimateCall = false) {
    errorHandler.validateAcceptSwapArgs(offerTxHex, takerPublicKey, makerInputTxHex, takerInputTxHex, takerVout, paymentPubKey, paymentUtxo);
    const unsignedData = [];
  
    const tx = new bsv.Transaction(offerTxHex);
    const takerUtxoTxObj = new bsv.Transaction(takerInputTxHex).toObject();
    const makerUtxoTxObj = new bsv.Transaction(makerInputTxHex).toObject();
    const makerPublicKeyHash = utility.getPkhFromP2pkhOut(tx.outputs[0]._scriptBuffer);
    const takerPublicKeyHash = utility.getPKHfromPublicKey(takerPublicKey);
    const paymentPublicKeyHash = utility.getPKHfromPublicKey(paymentPubKey);
    const makerVout = tx.inputs[0].outputIndex;
    const isZeroFee = (!paymentUtxo);
  
    const takerInputUtxo = {
      txid: takerUtxoTxObj.hash,
      vout: takerVout,
      satoshis: takerUtxoTxObj.outputs[takerVout].satoshis,
      script: takerUtxoTxObj.outputs[takerVout].script,
    };
  
    const makerInputUtxo = {
      txid: makerUtxoTxObj.hash,
      vout: makerVout,
      satoshis: makerUtxoTxObj.outputs[makerVout].satoshis,
      script: makerUtxoTxObj.outputs[makerVout].script,
    };
  
    const makerIsStas = stasUtils.isStasScript(makerInputUtxo.script);
    const takerIsStas = stasUtils.isStasScript(takerInputUtxo.script);
    const makerIsStas20 = stasUtils.checkIfStas20(makerInputUtxo.script);
    const takerIsStas20 = stasUtils.checkIfStas20(takerInputUtxo.script);
    const takerIsStas789 = stasUtils.checkIfStas789(takerInputUtxo.script);
    const makerIsStas789 = stasUtils.checkIfStas789(makerInputUtxo.script);
  
  
    let takerWantedScript;
    if (makerIsStas) {
      takerWantedScript = stasUtils.updateStasScript(takerPublicKeyHash, makerInputUtxo.script);
    } else {
      takerWantedScript = utility.buildP2pkhOutputScript(takerPublicKeyHash);
    }
  
    tx.from(takerInputUtxo);
    tx.addOutput(new bsv.Transaction.Output({
      script: takerWantedScript,
      satoshis: makerInputUtxo.satoshis,
    }));
  
    const outputData = [{publicKeyHash: makerPublicKeyHash}, {publicKeyHash: takerPublicKeyHash}];
  
    let totalAdditionalOutputAmount = 0;
    if (additionalOutputs && additionalOutputs.length) {
      for (const output of additionalOutputs) {
        const outputPublicKeyHash = utility.addressToPKH(output.address);
        let outScript;
        if (takerIsStas) {
          outScript = stasUtils.updateStasScript(outputPublicKeyHash, takerInputUtxo.script);
        } else {
          outScript = utility.buildP2pkhOutputScript(outputPublicKeyHash);
        }
        tx.addOutput(new bsv.Transaction.Output({
          script: outScript,
          satoshis: output.satoshis,
        }));
        outputData.push({publicKeyHash: outputPublicKeyHash});
        totalAdditionalOutputAmount += output.satoshis;
      }
    }
  
    if (!isZeroFee) {
      tx.from(paymentUtxo);
    }
  
    if (!isZeroFee && !isZeroChange) {
      tx.addOutput(new bsv.Transaction.Output({
        script: utility.buildP2pkhOutputScript(paymentPublicKeyHash),
        satoshis: paymentUtxo.satoshis - txCost,
      }));
      outputData.push({publicKeyHash: paymentPublicKeyHash});
    }
  
    if (isZeroChange && !feeEstimateCall) {
      errorHandler.swapTakerAmountCheck(takerInputUtxo.satoshis, tx.outputs[0].satoshis, totalAdditionalOutputAmount);
      errorHandler.checkZeroChangeThreshold(paymentUtxo.satoshis, txCost, 'Accept Swap Function Zero Change');
    }
  
    let outputsUnlockingScriptPart = ``;
    for (let i = 0; i < outputData.length; i++) {
      outputsUnlockingScriptPart += `${utility.numberToLESM(tx.outputs[i].satoshis)} ${outputData[i].publicKeyHash} `;
      if (i === 0 && takerIsStas789 || i === 0 && makerIsStas789) {
        outputsUnlockingScriptPart += `OP_FALSE `;
      }
    }
  
    if (isZeroFee) {
      outputsUnlockingScriptPart += `OP_FALSE OP_FALSE `;
    }
  
    if (isZeroChange || isZeroFee) {
      outputsUnlockingScriptPart += `OP_FALSE OP_FALSE `;
    }
  
    if (makerIsStas20 || takerIsStas20) {
      outputsUnlockingScriptPart += `OP_FALSE `;
    }
  
    if (!isZeroFee) {
      outputsUnlockingScriptPart += `${utility.numberToLESM(paymentUtxo.vout)} ${utility.reverseEndian(paymentUtxo.txid)} `;
    }
  
    const takerPreimage = bsv.Transaction.Sighash.sighashPreimage(tx, utility.SIGHASH, 1, bsv.Script.fromHex(takerInputUtxo.script), new bsv.crypto.BN(takerInputUtxo.satoshis)).toString('hex');
  
    if (makerIsStas) {
      const makerPreimage = bsv.Transaction.Sighash.sighashPreimage(tx, utility.SIGHASH, 0, bsv.Script.fromHex(makerInputUtxo.script), new bsv.crypto.BN(makerInputUtxo.satoshis), utility.FLAGS).toString('hex');
      const makerUnlockScript = `${outputsUnlockingScriptPart}${utility.numberToLESM(takerInputUtxo.vout)} ${takerInputTxHex} OP_1 ${makerPreimage}`;
      const fullMakerScript = bsv.Script.fromASM(`${makerUnlockScript} ${bsv.Script(tx.inputs[0].script).toASM()}`);
      tx.inputs[0].setScript(fullMakerScript);
    }
  
    let takerUnlockScript = ``;
    if (takerIsStas) {
      takerUnlockScript += `${outputsUnlockingScriptPart}${utility.numberToLESM(makerInputUtxo.vout)} ${makerInputTxHex} OP_1 ${takerPreimage} `;
    }
  
    if (ownerPrivateKey) {
      takerUnlockScript += `${bsv.Transaction.Sighash.sign(tx, ownerPrivateKey, utility.SIGHASH, 1, bsv.Script.fromHex(takerInputUtxo.script), new bsv.crypto.BN(takerInputUtxo.satoshis), utility.FLAGS).toTxFormat().toString('hex')} ${takerPublicKey}`;
      tx.inputs[1].setScript(bsv.Script.fromASM(takerUnlockScript));
    } else {
      tx.inputs[1].setScript(bsv.Script.fromASM(takerUnlockScript));
      // We set the stas = true since the unlock script will either be empty or unlocking for Stas script.
      unsignedData.push({inputIndex: 1, satoshis: new bsv.crypto.BN(takerInputUtxo.satoshis), script: bsv.Script.fromHex(takerInputUtxo.script), sighash: utility.SIGHASH, publicKeyString: takerPublicKey, flags: utility.FLAGS, stas: true});
    }
  
    if (paymentPrivateKey) {
      tx.inputs[2].setScript(bsv.Script.fromASM(`${bsv.Transaction.sighash.sign(tx, paymentPrivateKey, utility.SIGHASH, 2, tx.inputs[2].output._script, new bsv.crypto.BN(paymentUtxo.satoshis), utility.FLAGS).toTxFormat().toString('hex')} ${paymentPubKey}`));
    } else {
      unsignedData.push({inputIndex: 2, satoshis: tx.inputs[2].output._satoshisBN, script: tx.inputs[2].output._script, sighash: utility.SIGHASH, publicKeyString: paymentPubKey, stas: false});
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
 * Will create a new signed transaction for a token atomic swap.
 * @param {string} offerTxHex - transaction in hexadecimal string format representing the transaction
 * @param {object} ownerPrivateKey - private key for the taker utxo that is supplied based on takerInputTxHex and vout value
 * @param {string} makerInputTxHex - whole transaction in hexadecimal format representing the input from the maker in the offerTxHex
 * @param {string} takerInputTxHex - whole transaction in hexadecimal format of the taker input UTXO provided for the atomic swap
 * @param {number} takerVout - output index of the taker utxo being used as the input in the atomic swap transaction
 * @param {object} paymentPrivateKey - private key for the paymentUtxo
 * @param {object} paymentUtxo - utxo that is provided to pay the transaction fee
 * @param {array} additionalOutputs - a list of output information that will add more outputs to an atomic swap transaction
 * @param {string} data - optional data field that can be used for certain STAS token templates
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @param {number} txCost - total cost of the transaction in satoshis based on the fee rate from the BSV libary
 * @param {boolean} feeEstimateCall - if true will bypass the isZeroChange error handling as it would be called only to return the transaction fee estimate
 * @return {Promise<string>} - will return a promise that contains the signed transaction in hexadecimal format
 */
async function signedFunc(offerTxHex, ownerPrivateKey, makerInputTxHex, takerInputTxHex, takerVout, paymentPrivateKey, paymentUtxo, additionalOutputs, data, isZeroChange, txCost, feeEstimateCall) {
    return await unSignedFunc(offerTxHex, bsv.PublicKey.fromPrivateKey(ownerPrivateKey).toString('hex'), makerInputTxHex, takerInputTxHex, takerVout, bsv.PublicKey.fromPrivateKey(paymentPrivateKey).toString('hex'), paymentUtxo, additionalOutputs, data, isZeroChange, ownerPrivateKey, paymentPrivateKey, txCost, feeEstimateCall);
}
  
/**
 * Will return a fee estimate for the token atomic swap transaction.
 * @param {string} offerTxHex - transaction in hexadecimal string format representing the transaction
 * @param {string} makerInputTxHex - whole transaction in hexadecimal format representing the input from the maker in the offerTxHex
 * @param {string} takerInputTxHex - whole transaction in hexadecimal format of the taker input UTXO provided for the atomic swap
 * @param {number} takerVout - output index of the taker utxo being used as the input in the atomic swap transaction
 * @param {array} additionalOutputs - a list of output information that will add more outputs to an atomic swap transaction
 * @param {string} data - optional data field that can be used for certain STAS token templates
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @return {Promise<number>} - will return a number that will be the fee estimate for the transaction
 */
async function feeEstimate(offerHex, makerInputTxHex, takerInputTxHex, takerVout, additionalOutputs, data, isZeroChange) {
    const outputs = [];
    if (additionalOutputs && additionalOutputs.length) {
      for (let i = 0; i < additionalOutputs.length; i++) {
        outputs.push(feeEstimates.splitDestinationAddressTemplate);
      }
    }
    const swapHex = await signedFunc(offerHex, feeEstimates.templatePrivateKey, makerInputTxHex, takerInputTxHex, takerVout, feeEstimates.templatePrivateKey, feeEstimates.paymentUtxoTemplate, outputs, data, isZeroChange, feeEstimates.txCost, true);
    return new bsv.Transaction(swapHex).feePerKb(utility.SATS)._estimateFee() + feeEstimates.signInputAmount;
}
  
/**
 * Will create a new signed transaction for a token atomic swap.
 * @param {string} offerTxHex - transaction in hexadecimal string format representing the transaction
 * @param {object} ownerPrivateKey - private key for the taker utxo that is supplied based on takerInputTxHex and vout value
 * @param {string} makerInputTxHex - whole transaction in hexadecimal format representing the input from the maker in the offerTxHex
 * @param {string} takerInputTxHex - whole transaction in hexadecimal format of the taker input UTXO provided for the atomic swap
 * @param {number} takerVout - output index of the taker utxo being used as the input in the atomic swap transaction
 * @param {object} paymentPrivateKey - private key for the paymentUtxo
 * @param {object} paymentUtxo - utxo that is provided to pay the transaction fee
 * @param {array} additionalOutputs - a list of output information that will add more outputs to an atomic swap transaction
 * @param {string} data - optional data field that can be used for certain STAS token templates
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @return {Promise<string>} - will return a promise that contains the signed transaction in hexadecimal format
 */
async function signed(offerTxHex, ownerPrivateKey, makerInputTxHex, takerInputTxHex, takerVout, paymentPrivateKey, paymentUtxo, additionalOutputs, data, isZeroChange) {
    const txCost = await feeEstimate(offerTxHex, makerInputTxHex, takerInputTxHex, takerVout, additionalOutputs, data, isZeroChange);
    return await signedFunc(offerTxHex, ownerPrivateKey, makerInputTxHex, takerInputTxHex, takerVout, paymentPrivateKey, paymentUtxo, additionalOutputs, data, isZeroChange, txCost);
}
  
/**
 * Will create a new unSigned transaction for a token atomic swap.
 * @param {string} offerTxHex - transaction in hexadecimal string format representing the transaction
 * @param {string} ownerPubKey - the public key of the taker input that is referenced from the takerInputTxHex
 * @param {string} makerInputTxHex - whole transaction in hexadecimal format representing the input from the maker in the offerTxHex
 * @param {string} takerInputTxHex - whole transaction in hexadecimal format of the taker input UTXO provided for the atomic swap
 * @param {number} takerVout  - output index of the taker utxo being used as the input in the atomic swap transaction
 * @param {string} paymentPubKey - payment public key string
 * @param {object} paymentUtxo - utxo that is provided to pay the transaction fee
 * @param {array} additionalOutputs - a list of output information that will add more outputs to an atomic swap transaction
 * @param {string} data - optional data field that can be used for certain STAS token templates
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @return {Promise<object>} - will return a promise containing the information about the unsigned input(s) along with the transaction
 */
async function unSigned(offerTxHex, ownerPubKey, makerInputTxHex, takerInputTxHex, takerVout, paymentPubKey, paymentUtxo, additionalOutputs, data, isZeroChange) {
    const txCost = await feeEstimate(offerTxHex, makerInputTxHex, takerInputTxHex, takerVout, additionalOutputs, data, isZeroChange);
    return await unSignedFunc(offerTxHex, ownerPubKey, makerInputTxHex, takerInputTxHex, takerVout, paymentPubKey, paymentUtxo, additionalOutputs, data, isZeroChange, undefined, undefined, txCost);
}

module.exports =  {signed, unSigned, feeEstimate}
