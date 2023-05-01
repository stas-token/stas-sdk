const bsv = require('bsv')
/**
 * Use this file to log random private key and its address for use in testing
 */
const privateKeyOne = bsv.PrivateKey.fromRandom()
const address = bsv.Address.fromPrivateKey(privateKeyOne)

console.log('Address to send funds to:  ' + address.toString())
console.log('Funding Private Key: ' + privateKeyOne.toString())


