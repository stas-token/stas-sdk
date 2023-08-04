const bsv = require('bsv')
const utility = require('./utility')
const stasUtils = require('./stasTemplates')
const errorHandler = require('./errors')
const feeEstimates = require('./stasFeeEstimates')

// STAS issuance
/**
 * @param {string} issuerPublicKey - public key string of the issuer of the token and contractUtxo
 * @param {object} contractUtxo - contract UTXO that was returned from the stasContract function
 * @param {string} paymentPublicKey - payment public key string for the payment UTXO
 * @param {object} paymentUtxo - utxo that is provided to pay the transaction fee.
 * @param {array} issueData - data that is included at the end of the token script
 * @param {boolean} isSplittable - will determine if the token is splittable or not splittable
 * @param {string} symbol - token symbol that will be added to the token script
 * @param {string} protocol - protocol value of the type of token template wanting to issue
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @param {object} issuerPrivateKey - private key for the issuer and contractUtxo
 * @param {object} paymentPrivateKey - private key for the paymentUtxo
 * @param {number} txCost - total cost of the transaction in satoshis based on the fee rate from the BSV libary
 * @param {boolean} feeEstimateCall - if true will bypass some error handling as it would be called only to return the transaction fee estimate
 * @return {Promise<string|object>} - Will return one of two options.
 *  - If all private keys are supplied for all inputs, resolves with the signed transaction in hexadecimal format.
 *  - If not all private keys are supplied to sign the transaction, resolves with an object containing information about the unsigned input(s) along with the transaction.
 */
async function unSignedFunc(issuerPublicKey, contractUtxo, paymentPublicKey, paymentUtxo, issueData, isSplittable, symbol, protocol, isZeroChange = false, issuerPrivateKey, paymentPrivateKey, txCost, feeEstimateCall = false) {
  errorHandler.validateIssuanceArgs(issuerPublicKey, contractUtxo, paymentPublicKey, paymentUtxo, issueData, isSplittable, symbol, protocol);

  const unsignedData = [];

  const isZeroFee = (paymentUtxo === null);
  const tx = new bsv.Transaction();
  tx.from(contractUtxo);

  if (!isZeroFee) {
    tx.from(paymentUtxo);
  }

  for (const data of issueData) {
    const outputPublicKeyHash = utility.addressToPKH(data.addr);
    let tokenOutputDataHex;
    if (data.data) {
      tokenOutputDataHex = stasUtils.formatDataToAsmWithOpCodeConversion(data.data);
    }
    const symbolHex = Buffer.from(symbol).toString('hex');
    const stasScript = stasUtils.getStasProtocolScript(outputPublicKeyHash, issuerPublicKey, tokenOutputDataHex, isSplittable, symbolHex, protocol);
    tx.addOutput(new bsv.Transaction.Output({
      script: stasScript,
      satoshis: data.satoshis,
    }));
  }

  if (!isZeroFee && !isZeroChange) {
    const paymentPubKeyHash = utility.getPKHfromPublicKey(paymentPublicKey);
    tx.addOutput(new bsv.Transaction.Output({
      script: utility.buildP2pkhOutputScript(paymentPubKeyHash),
      satoshis: paymentUtxo.satoshis - txCost,
    }));
  }

  if (isZeroChange && !feeEstimateCall) {
    errorHandler.checkZeroChangeThreshold(paymentUtxo.satoshis, txCost, 'Issuance Function Zero Change');
  }

  if (issuerPrivateKey) {
    tx.inputs[0].setScript(bsv.Script.fromASM(`${bsv.Transaction.sighash.sign(tx, issuerPrivateKey, utility.SIGHASH, 0, tx.inputs[0].output._script, tx.inputs[0].output._satoshisBN).toTxFormat().toString('hex')} ${issuerPublicKey}`));
  } else {
    unsignedData.push({inputIndex: 0, satoshis: tx.inputs[0].output._satoshisBN, script: tx.inputs[0].output._script, sighash: utility.SIGHASH, publicKeyString: issuerPublicKey, stas: false});
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
 * Will create a new signed transaction for a token issuance.
 * @param {object} issuerPrivateKey - private key for the issuer and contractUtxo
 * @param {array} issueData - data that is included at the end of the token script
 * @param {object} contractUtxo - contract UTXO that was returned from the stasContract function
 * @param {object} paymentUtxo - utxo that is provided to pay the transaction fee.
 * @param {object} paymentPrivateKey - private key for the paymentUtxo
 * @param {boolean} isSplittable - will determine if the token is splittable or not splittable
 * @param {string} symbol - token symbol that will be added to the token script
 * @param {string} protocol - protocol value of the type of token template wanting to issue
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @param {number} txCost - total cost of the transaction in satoshis based on the fee rate from the BSV libary
 * @param {boolean} feeEstimateCall - if true will bypass some error handling as it would be called only to return the transaction fee estimate
 * @return {Promise<string>} - will return a promise that contains the signed transaction in hexadecimal format
 */
async function signedFunc(issuerPrivateKey, issueData, contractUtxo, paymentUtxo, paymentPrivateKey, isSplittable, symbol, protocol, isZeroChange = false, txCost, feeEstimateCall) {
  return unSignedFunc(issuerPrivateKey.publicKey.toString('hex'), contractUtxo, paymentPrivateKey.publicKey.toString('hex'), paymentUtxo, issueData, isSplittable, symbol, protocol, isZeroChange, issuerPrivateKey, paymentPrivateKey, txCost, feeEstimateCall);
}

/**
 * Will return a fee estimate for the token issuance transaction.
 * @param {array} issueData - data that is included at the end of the token script
 * @param {object} contractUtxo - contract UTXO that was returned from the stasContract function
 * @param {boolean} isSplittable - will determine if the token is splittable or not splittable
 * @param {string} symbol - token symbol that will be added to the token script
 * @param {string} protocol - protocol value of the type of token template wanting to issue
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @return {Promise<number>} - will return a number that will be the fee estimate for the transaction
 */
async function feeEstimate(issueData, contractUtxo, isSplittable, symbol, protocol, isZeroChange) {
  const issueHex = await signedFunc(feeEstimates.templatePrivateKey, issueData, contractUtxo, feeEstimates.paymentUtxoTemplate, feeEstimates.templatePrivateKey, isSplittable, symbol, protocol, isZeroChange, feeEstimates.txCost, true);
  return new bsv.Transaction(issueHex).feePerKb(utility.SATS)._estimateFee();
}

/**
 * Will create a new signed transaction for a token issuance.
 * @param {object} issuerPrivateKey - private key for the issuer and contractUtxo
 * @param {array} issueData - data that is included at the end of the token script
 * @param {object} contractUtxo - contract UTXO that was returned from the stasContract function
 * @param {object} paymentUtxo - utxo that is provided to pay the transaction fee.
 * @param {object} paymentPrivateKey - private key for the paymentUtxo
 * @param {boolean} isSplittable - will determine if the token is splittable or not splittable
 * @param {string} symbol - token symbol that will be added to the token script
 * @param {string} protocol - protocol value of the type of token template wanting to issue
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @return {Promise<string>} - will return a promise that contains the signed transaction in hexadecimal format
 */
async function signed(issuerPrivateKey, issueData, contractUtxo, paymentUtxo, paymentPrivateKey, isSplittable, symbol, protocol, isZeroChange) {
  const txCost = await feeEstimate(issueData, contractUtxo, isSplittable, symbol, protocol, isZeroChange);
  return await signedFunc(issuerPrivateKey, issueData, contractUtxo, paymentUtxo, paymentPrivateKey, isSplittable, symbol, protocol, isZeroChange, txCost);
}

/**
 * Will create a new unSigned transaction for a token issuance.
 * @param {string} issuerPublicKey - public key string of the issuer of the token and contractUtxo
 * @param {object} contractUtxo - contract UTXO that was returned from the stasContract function
 * @param {string} paymentPublicKey - payment public key string for the payment UTXO
 * @param {object} paymentUtxo - utxo that is provided to pay the transaction fee.
 * @param {array} issueData - data that is included at the end of the token script
 * @param {boolean} isSplittable - will determine if the token is splittable or not splittable
 * @param {string} symbol - token symbol that will be added to the token script
 * @param {string} protocol - protocol value of the type of token template wanting to issue
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @return {Promise<object>} - will return a promise containing the information about the unsigned input(s) along with the transaction
 */
async function unSigned(issuerPublicKey, contractUtxo, paymentPublicKey, paymentUtxo, issueData, isSplittable, symbol, protocol, isZeroChange) {
  const txCost = await feeEstimate(issueData, contractUtxo, isSplittable, symbol, protocol, isZeroChange);
  return await unSignedFunc(issuerPublicKey, contractUtxo, paymentPublicKey, paymentUtxo, issueData, isSplittable, symbol, protocol, isZeroChange, undefined, undefined, txCost);
}

module.exports = {signed, unSigned, feeEstimate}
  