const bsv = require('bsv')
const utility = require('./utility')
const stasUtils = require('./stasTemplates')
const errorHandler = require('./errors')

// STAS Create Offer
/**
 * This function will create a atomic swap offer from either STAS token or native satoshis UTXO.
 * @param {string} ownerPublicKey - public key string of the token or native UTXO owner
 * @param {object} utxo - utxo that is used to be swapped. can be native BSV or STAS
 * @param {object} wantedData - data that will define what is wanted for the atomic swap in return for the utxo value. This must contain value "satoshis" (number) and also optionally can contain "script" (hex string) in the case for STAS token
 * @param {object} ownerPrivateKey - private key that is used to sign the utxo value provided
 * @return {Promise<string|object>} - Will return one of two options.
 *  - If all private keys are supplied for all inputs, resolves with the signed transaction in hexadecimal format.
 *  - If not all private keys are supplied to sign the transaction, resolves with an object containing information about the unsigned input(s) along with the transaction.
 */
async function unSigned(ownerPublicKey, utxo, wantedData, ownerPrivateKey) {
    errorHandler.validateCreateSwapArgs(ownerPublicKey, utxo, wantedData);
  
    const unsignedData = [];
    const ownerPublicKeyHash = utility.getPKHfromPublicKey(ownerPublicKey);
    let wantedScript;
    if (wantedData.script) {
      wantedScript = bsv.Script.fromHex(stasUtils.updateStasScript(ownerPublicKeyHash, wantedData.script));
    } else {
      wantedScript = utility.buildP2pkhOutputScript(ownerPublicKeyHash);
    }
    const tx = new bsv.Transaction();
    tx.from(utxo);
    tx.addOutput(new bsv.Transaction.Output({
      script: wantedScript,
      satoshis: wantedData.satoshis,
    }));
  
    if (ownerPrivateKey) {
      tx.inputs[0].setScript(bsv.Script.fromASM(`${bsv.Transaction.sighash.sign(tx, ownerPrivateKey, utility.SIGHASH_SINGLE, 0, tx.inputs[0].output._script, tx.inputs[0].output._satoshisBN, utility.FLAGS).toTxFormat().toString('hex')} ${ownerPublicKey}`));
      return tx.serialize(true);
    } else {
      unsignedData.push({inputIndex: 0, satoshis: tx.inputs[0].output._satoshisBN, script: tx.inputs[0].output._script, sighash: utility.SIGHASH_SINGLE, publicKeyString: ownerPublicKey, flags: utility.FLAGS, stas: false});
      return {
        unsignedData: unsignedData,
        tx: tx,
      };
    }
}
  
/**
 * This function will create a signed atomic swap offer from either STAS token or native satoshis UTXO.
 * @param {object} ownerPrivateKey - private key that is used to sign the utxo value provided
 * @param {object} utxo - utxo that is used to be swapped. can be native BSV or STAS
 * @param {object} wantedData - data that will define what is wanted for the atomic swap in return for the utxo value. This must contain value "satoshis" (number) and also optionally can contain "script" (hex string) in the case for STAS token
 * @return {Promise<string>} - will return a promise that contains the signed transaction in hexadecimal format
 */
async function signed(ownerPrivateKey, utxo, wantedData) {
    return await unSigned(bsv.PublicKey.fromPrivateKey(ownerPrivateKey).toString(), utxo, wantedData, ownerPrivateKey);
}

module.exports =  {signed, unSigned}

    