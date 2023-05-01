const {stasIssuance, stasContract, utility, tokenSchemaTemplate, stasRedeem} = require('../index');
const testTools = require('./testUtility')

/**
 * This function will mint a token for on mainnet for test purposes. To Run this function you will require to setup and fund an addresse in the testUtility.js file.
 * Please check testUtility.js for more information on how to setup private keys for testing.
 * For testing purposes you will need approx 5000 satoshis. Any remaining satoshis can be returned to a desired address by using the getFundsFromAddress.js file.
 * This test will create a token with 10 supply. The Supply is based on the native amount in satoshis locked in the token script, in this case is 10 satoshis.
 * As this is for example purposes only we will also redeem the token at the the end to convert the satoshis back to native BSV
 * 
 * This mint example will use the STAS-20 token template. This template is unique in that it can only be redeemed (destroyed back to native BSV satoshis) by the issuer address. 
 * For testing other tokens please see the documentation for more details.
 */
const instantMint = async () => {

    console.log('Starting Instant Mint Example...') 

    // Get UTXO data from Whats On Chain API for funding address
    console.log('Fetching UTXO from the blockchain...')
    await testTools.getAddressUtxos()

    const balance = await testTools.getBalance(testTools.utxos)
    if(balance < 5000){
        throw new Error('Balance too low for instant mint, requires a minimum of 5000 satoshis')
    }

    console.log('Building transactions...')
    // Prepare UTXOs for instant mint
    await testTools.prepareUtxosForMint(10)

    // Issue data 
    const issueData = [{
        addr: testTools.issuerAddress, // address the token is being issued to
        satoshis: 10, // amount of satoshis of the STAS token the address is receiving 
        data: ['STAS TOKEN TESTING'] // token meta data add to the end of the script in OP_RETURN
    }]

    // Create contract TX
    const contractHex = await stasContract.signed(testTools.issuerPrivateKey, testTools.issuerUtxo, testTools.contractFeeUtxo, testTools.privateKey, tokenSchemaTemplate, 10)
    const contractTxResponse = await testTools.broadcast(contractHex)
    console.log('Contract Txid: ', contractTxResponse.data)
    const contractUtxo = utility.getUtxoFromTx(contractHex, 0)
    
    // Create issue TX
    const issueHex = await stasIssuance.signed(testTools.issuerPrivateKey, issueData, contractUtxo, testTools.issueFeeUtxo, testTools.privateKey, true, tokenSchemaTemplate.symbol, 'STAS-20')  
    const issueTxResponse = await testTools.broadcast(issueHex)
    console.log('Issue Txid: ', issueTxResponse.data) 
    const tokenUtxoFromIssuance = utility.getUtxoFromTx(issueHex, 0)  

    // Create redeem TX
    const redeemHex = await stasRedeem.signed(testTools.issuerPrivateKey, tokenUtxoFromIssuance,testTools.redeemFeeUtxo, testTools.privateKey )
    const redeemTxResponse = await testTools.broadcast(redeemHex)
    console.log('Redeem Txid: ', redeemTxResponse.data) 

    console.log('Instant Mint Example Completed') 
}

instantMint()