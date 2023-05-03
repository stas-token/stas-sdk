const bsv = require('bsv')
const {stasIssuance, stasContract, utility, tokenSchemaTemplate} = require('../index');

/**
 * This file will use template UTXOs and example private keys to create the contract and issuance transactions. This is for demonstration purposes only.
 */
const issuerPrivateKey = bsv.PrivateKey.fromString('L5MgGTPJRMqHyUX5UsD4JWMwMUFGdFwVL73vvcRmuPhVD1Avzugr');
const paymentPrivateKey = bsv.PrivateKey.fromString('L5MgGTPJRMqHyUX5UsD4JWMwMUFGdFwVL73vvcRmuPhVD1Avzugr');
const tokenIssueAddress = '14pp1Mm6ohMxC8SqGSdq5L9ToCjLXJBHTK';
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

const issueData = [{
  addr: tokenIssueAddress,
  satoshis: 10,
  data: ['STAS TOKEN TESTING'],
}];

const mintNonBroadcast = async () => {
  const contractHex = await stasContract.signed(issuerPrivateKey, utxoTemplateForContract, utxoTemplateForFees, paymentPrivateKey, tokenSchemaTemplate, 10);
  console.log('Contract Transaction Hex: ', contractHex);
  const contractUtxo = utility.getUtxoFromTx(contractHex, 0);
  const issueHex = await stasIssuance.signed(issuerPrivateKey, issueData, contractUtxo, utxoTemplateForFees, paymentPrivateKey, true, tokenSchemaTemplate.symbol, 'STAS-20');
  console.log('Issue Transaction Hex: ', issueHex);
};

mintNonBroadcast();