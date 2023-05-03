const testTools = require('./testUtility');

/**
 * This funciton will return any funds that are remaining in the testing private keys to a destination address of your choice.
 * @param {string} address - This is the address string you would like to send the funds to
 * NOTE: the private key associated with testing must be present in the testUtility.js file to complete this transaction.
 * To run this function put in the terminal : node getFundsFromAddress.js
 */
const sendFundsFromAddress = async (address) => {
  await testTools.getAddressUtxos();
  await testTools.sendRemainingFundsToAddress(address);
};

sendFundsFromAddress('ADD IN ADDRESS STRING HERE WHERE YOU WANT THE REMAINING BSV FUNDS TO GO');