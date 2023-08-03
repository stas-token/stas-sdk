const bsv = require('bsv')
const utility = require('./utility')
const errorHandler = require('./errors')
const feeEstimates = require('./stasFeeEstimates')

// STAS Contract
/**
 * This function will create a contract transaction that contains a JSON object representing all the information about the token.
 * @param {string} issuerPublicKey - public key string of the issuer of the token.
 * @param {object} contractUtxo - utxo containing the satoshis required for the tokenSatoshis amount.
 * @param {string} paymentPublicKey - payment public key string.
 * @param {object} paymentUtxo - utxo that is provided to pay the transaction fee.
 * @param {object} tokenSchema - JSON object representing all the information about the token.
 * @param {number} tokenSatoshis - Number of satoshis provided for the contract UTXO.
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @param {object} issuerPrivateKey - private key for the issuer and contractUtxo
 * @param {object} paymentPrivateKey - private key for the paymentUtxo
 * @param {number} txCost - total cost of the transaction in satoshis based on the fee rate from the BSV libary
 * @param {boolean} feeEstimateCall - if true will bypass some error handling as it would be called only to return the transaction fee estimate
 * @return {Promise<string|object>} - Will return one of two options.
 *  - If all private keys are supplied for all inputs, resolves with the signed transaction in hexadecimal format.
 *  - If not all private keys are supplied to sign the transaction, resolves with an object containing information about the unsigned input(s) along with the transaction.
*/
async function unSignedFunc(issuerPublicKey, contractUtxo, paymentPublicKey, paymentUtxo, tokenSchema, tokenSatoshis, isZeroChange = false, issuerPrivateKey, paymentPrivateKey, txCost, feeEstimateCall = false) {
  const issuerPublicKeyHash = utility.getPKHfromPublicKey(issuerPublicKey);
  tokenSchema.tokenId = issuerPublicKeyHash;
  errorHandler.validateContractArgs(issuerPublicKey, contractUtxo, paymentPublicKey, paymentUtxo, tokenSchema, tokenSatoshis);

  const unsignedData = [];

  const issuerP2pkh = utility.buildP2pkhOutputScript(issuerPublicKeyHash);
  const contractOutputScript = `${issuerP2pkh} ${bsv.Script.buildDataOut(JSON.stringify(tokenSchema))}`;
  const isZeroFee = (!paymentUtxo);
  let paymentPublicKeyHash;
  let paymentChangeScript;
  if (!isZeroFee) {
    paymentPublicKeyHash = utility.getPKHfromPublicKey(paymentPublicKey);
    paymentChangeScript = utility.buildP2pkhOutputScript(paymentPublicKeyHash);
  }

  const tx = new bsv.Transaction();

  tx.from(contractUtxo);

  if (!isZeroFee) {
    tx.from(paymentUtxo);
  }

  tx.addOutput(
      new bsv.Transaction.Output({
        script: contractOutputScript,
        satoshis: tokenSatoshis,
      }),
  );

  if (contractUtxo.satoshis > tokenSatoshis) {
    tx.addOutput(
        new bsv.Transaction.Output({
          script: issuerP2pkh,
          satoshis: Math.floor(contractUtxo.satoshis - tokenSatoshis),
        }),
    );
  }

  if (!isZeroFee && !isZeroChange) {
    tx.addOutput(
        new bsv.Transaction.Output({
          script: paymentChangeScript,
          satoshis: Math.floor(paymentUtxo.satoshis - txCost),
        }),
    );
  }

  if (isZeroChange && !feeEstimateCall) {
    errorHandler.checkZeroChangeThreshold(paymentUtxo.satoshis, txCost, 'Contract Function Zero Change');
  }

  if (issuerPrivateKey) {
    tx.sign(issuerPrivateKey);
  } else {
    unsignedData.push({inputIndex: 0, satoshis: tx.inputs[0].output._satoshisBN, script: tx.inputs[0].output._script, sighash: utility.SIGHASH, publicKeyString: issuerPublicKey, stas: false});
  }

  if (!isZeroFee) {
    if (paymentPrivateKey) {
      tx.sign(paymentPrivateKey);
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
 * Will create a new signed transaction for a token contract.
 * @param {object} issuerPrivateKey - private key for the issuer and contractUtxo
 * @param {object} contractUtxo - utxo containing the exact amount of satoshis required for the contract token supply based in satoshis.
 * @param {object} paymentUtxo - utxo that is provided to pay the transaction fee.
 * @param {object} paymentPrivateKey - private key for the paymentUtxo
 * @param {object} tokenSchema - JSON object representing all the information about the token.
 * @param {number} tokenSatoshis - Number of satoshis provided for the contract UTXO.
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @param {number} txCost - total cost of the transaction in satoshis based on the fee rate from the BSV libary
 * @param {boolean} feeEstimateCall - if true will bypass some error handling as it would be called only to return the transaction fee estimate
 * @return {Promise<string>} - will return a promise that contains the signed transaction hexadecimal
 */
async function signedFunc(issuerPrivateKey, contractUtxo, paymentUtxo, paymentPrivateKey, tokenSchema, tokenSatoshis, isZeroChange = false, txCost, feeEstimateCall) {
  return await unSignedFunc(bsv.PublicKey.fromPrivateKey(issuerPrivateKey).toString('hex'), contractUtxo, bsv.PublicKey.fromPrivateKey(paymentPrivateKey).toString('hex'), paymentUtxo, tokenSchema, tokenSatoshis, isZeroChange, issuerPrivateKey, paymentPrivateKey, txCost, feeEstimateCall);
}

/**
 * Will return a fee estimate for the contract transaction.
 * @param {object} tokenSchema - JSON object representing all the information about the token.
 * @param {number} tokenSatoshis - Number of satoshis provided for the contract UTXO.
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @return {Promise<number>} - A promise that will return a fee es
 */
async function feeEstimate(tokenSchema, tokenSatoshis, isZeroChange) {
  feeEstimates.contractUtxoTemplate.satoshis = tokenSatoshis;
  const contractHex = await signedFunc(feeEstimates.templatePrivateKey, feeEstimates.contractUtxoTemplate, feeEstimates.paymentUtxoTemplate, feeEstimates.templatePrivateKey, tokenSchema, tokenSatoshis, isZeroChange, feeEstimates.txCost, true);
  return new bsv.Transaction(contractHex).feePerKb(utility.SATS)._estimateFee();
}

/**
 * Will create a new signed transaction for a token contract.
 * @param {object} issuerPrivateKey - private key for the issuer and contractUtxo
 * @param {object} contractUtxo - utxo containing the exact amount of satoshis required for the contract token supply based in satoshis.
 * @param {object} paymentUtxo - utxo that is provided to pay the transaction fee.
 * @param {object} paymentPrivateKey - private key for the paymentUtxo
 * @param {object} tokenSchema - JSON object representing all the information about the token.
 * @param {number} tokenSatoshis - Number of satoshis provided for the contract UTXO.
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @return {Promise<string>} - will return a promise that contains the signed transaction hexadecimal
 */
async function signed(issuerPrivateKey, contractUtxo, paymentUtxo, paymentPrivateKey, tokenSchema, tokenSatoshis, isZeroChange = false) {
  const txCost = await feeEstimate(tokenSchema, tokenSatoshis, isZeroChange);
  return await signedFunc(issuerPrivateKey, contractUtxo, paymentUtxo, paymentPrivateKey, tokenSchema, tokenSatoshis, isZeroChange, txCost);
}

/**
 * Will create a new unSigned transaction for a token contract.
 * @param {string} issuerPublicKey - public key string of the issuer of the token.
 * @param {object} contractUtxo - utxo containing the exact amount of satoshis required for the contract token supply based in satoshis.
 * @param {string} paymentPubKey - payment public key string.
 * @param {object} paymentUtxo - utxo that is provided to pay the transaction fee.
 * @param {object} tokenSchema - JSON object representing all the information about the token.
 * @param {number} tokenSatoshis - Number of satoshis provided for the contract UTXO.
 * @param {boolean} isZeroChange - if true will not return a change UTXO in the transaction
 * @return {Promise<object>} - will return a promise containing the information about the unsigned input(s) along with the transaction
 */
async function unSigned(issuerPublicKey, contractUtxo, paymentPubKey, paymentUtxo, tokenSchema, tokenSatoshis, isZeroChange) {
  const txCost = await feeEstimate(tokenSchema, tokenSatoshis, isZeroChange);
  return await unSignedFunc(issuerPublicKey, contractUtxo, paymentPubKey, paymentUtxo, tokenSchema, tokenSatoshis, isZeroChange, undefined, undefined, txCost);
}

module.exports =  {signed, unSigned, feeEstimate}
