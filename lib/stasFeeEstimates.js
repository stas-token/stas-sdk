const bsv = require('bsv')
const utility = require('./utility')
const stasUtils = require('./stasTemplates')

class FeeEstimates {

    constructor() {     
        this.templatePrivateKey = bsv.PrivateKey.fromString('L5MgGTPJRMqHyUX5UsD4JWMwMUFGdFwVL73vvcRmuPhVD1Avzugr')
        this.templateAddress = '1KKFc3hsN4Tz8ofe6LauhDD8YG6z4AHMYr'
        this.templatePublicKeyHash = 'c8e5f1437d5dbca99f82f20d6c5f03a012a54826'
        this.templateP2pkhOut = '76a914c8e5f1437d5dbca99f82f20d6c5f03a012a5482688ac'
        this.paymentUtxoTemplate = {
            txid : '1234567890123456789012345678901234567890123456789012345678901234',
            vout : 0,
            satoshis : 100000,
            script : this.templateP2pkhOut
        }
        this.contractUtxoTemplate = { 
            txid : '1234567890123456789012345678901234567890123456789012345678901234',
            vout : 0,
            satoshis : 0,
            script : this.templateP2pkhOut
        }
        this.splitDestinationAddressTemplate = {address : this.templateAddress, satoshis : 1}
        this.utility = utility
        this.txCost = 1
        this.stasUtils = stasUtils
        this.signInputAmount = 30
        
    }

    async buildSplitDestinations (numberOfSplits, totalTokenUtxoSatoshis) {
        let satoshis = 0
        const splitDestinations = []
        for (let i = 0; i < numberOfSplits - 1; i++) {
            splitDestinations.push(this.splitDestinationAddressTemplate)
            satoshis += this.splitDestinationAddressTemplate.satoshis
        }
        splitDestinations.push({address : this.templateAddress, satoshis : totalTokenUtxoSatoshis - satoshis})

        return splitDestinations

    }

}


module.exports = new FeeEstimates()
