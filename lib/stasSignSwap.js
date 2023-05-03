const bsv = require('bsv')
const utility = require('./utility')
const stasUtils = require('./stasTemplates')
const errorHandler = require('./errors')

// STAS Sign Swap
// TODO: Add in support for data and also for 50 outputs for STAS 50 templates
/**
 * @param {string} unSignedSwapHex - atomic swap transaction hexadecimal that has been already signed by the taker
 * @param {string} takerInputTxHex -  whole tx hex of the taker input UTXO provided for the atomic swap
 * @param {string} ownerPublicKey - public key string of the token or native UTXO owner
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @param {object} ownerPrivateKey - private key value for the STAS UTXO
 * @return {Promise<string|object>} - Will return one of two options.
 *  - If all private keys are supplied for all inputs, resolves with the signed transaction in hexadecimal format.
 *  - If not all private keys are supplied to sign the transaction, resolves with an object containing information about the unsigned input(s) along with the transaction.
 */
async function unSigned(unSignedSwapHex, takerInputTxHex, ownerPublicKey, isZeroChange, ownerPrivateKey) {
    errorHandler.validateSwapSignArgs(unSignedSwapHex, takerInputTxHex, ownerPublicKey);
  
    const unsignedData = [];
    const tx = bsv.Transaction(unSignedSwapHex);
    const offerTxObject = tx.toObject();
    const isZeroFee = (tx.inputs.length < 3);
    const ownerPublicKeyHash = utility.getPKHfromPublicKey(ownerPublicKey);
    const takerVout = tx.inputs[0].outputIndex;
    const takerScript = tx.outputs[1].script.toHex();
    const ownerScript = takerScript.substr(0, 6) + ownerPublicKeyHash + takerScript.substr(46);
    const makerIsStas20 = stasUtils.checkIfStas20(tx.outputs[1].script.toHex());
    const takerIsStas20 = stasUtils.checkIfStas20(tx.outputs[0].script.toHex());
    const takerIsStas789 = stasUtils.checkIfStas789(tx.outputs[0].script.toHex());
    const ownerIsStas = stasUtils.isStasScript(ownerScript);
  
    let ownerUnlockingScript = ``;
    let outputsUnlockingScriptPart = ``;
    if (ownerIsStas) {
      for (let i = 0; i < offerTxObject.outputs.length; i++) {
        outputsUnlockingScriptPart += `${utility.numberToLESM(offerTxObject.outputs[i].satoshis)} ${offerTxObject.outputs[i].script.slice(6, 46)} `;
        if (i === 0 && takerIsStas789) {
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
        outputsUnlockingScriptPart += `${utility.numberToLESM(offerTxObject.inputs[2].outputIndex)} ${utility.reverseEndian(offerTxObject.inputs[2].prevTxId)} `;
      }
      const makerPreimage = bsv.Transaction.Sighash.sighashPreimage(tx, utility.SIGHASH, 0, bsv.Script.fromHex(ownerScript), new bsv.crypto.BN(tx.outputs[1].satoshis), utility.FLAGS).toString('hex');
      outputsUnlockingScriptPart += `${utility.numberToLESM(takerVout)} ${takerInputTxHex} OP_1 ${makerPreimage} `;
      ownerUnlockingScript = outputsUnlockingScriptPart;
    }
    if (ownerPrivateKey) {
      ownerUnlockingScript += `${bsv.Transaction.Sighash.sign(tx, ownerPrivateKey, utility.SIGHASH, 0, bsv.Script.fromHex(ownerScript), new bsv.crypto.BN(tx.outputs[1].satoshis), utility.FLAGS).toTxFormat().toString('hex')} ${ownerPublicKey}`;
      tx.inputs[0].setScript(bsv.Script.fromASM(ownerUnlockingScript));
      return tx.serialize(true);
    } else {
      tx.inputs[0].setScript(bsv.Script.fromASM(outputsUnlockingScriptPart));
      unsignedData.push({inputIndex: 0, satoshis: new bsv.crypto.BN(tx.outputs[1].satoshis), script: bsv.Script.fromHex(ownerScript), sighash: utility.SIGHASH, publicKeyString: ownerPublicKey, flags: utility.FLAGS, stas: true});
      return {
        unsignedData: unsignedData,
        tx: tx,
      };
    }
}
  
/**
 * Will sign a atomic swap transaction on the maker input of the transaction
 * @param {string} unSignedSwapHex - atomic swap transaction hexadecimal that has been already signed by the taker
 * @param {object} ownerPrivateKey - private key value for the STAS UTXO
 * @param {string} takerInputTxHex -  whole tx hex of the taker input UTXO provided for the atomic swap
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @return {Promise<string>} - will return a promise that contains the signed transaction in hexadecimal format
 */
async function signed(unSignedSwapHex, ownerPrivateKey, takerInputTx, isZeroChange) {
    return await unSigned(unSignedSwapHex, takerInputTx, bsv.PublicKey.fromPrivateKey(ownerPrivateKey).toString(), isZeroChange, ownerPrivateKey);
}

module.exports =  {signed, unSigned}

    