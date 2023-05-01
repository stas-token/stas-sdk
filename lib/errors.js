const bsv = require('bsv');
const utility = require('./utility');
const stasUtils = require('./stasTemplates');

class Errors {
    constructor(){
        this.utility = utility
        this.stasUtils = stasUtils
    }

	validateContractArgs (issuerPublicKey, contractUtxo, paymentPublicKey, paymentUtxo, tokenSchema, tokenSatoshis) {
        const description =  'STAS Contract Function'
        this.checkPublicKey(issuerPublicKey, `${description} Issuer Public Key`)
        this.validateSchema(tokenSchema)
        this.validateUtxo(contractUtxo, `${description} Contract Utxo`)
        this.checkTokenSatoshisWithAmounts(tokenSatoshis, tokenSchema, contractUtxo, description)
        this.checkIfZeroFeeConditions(paymentPublicKey, paymentUtxo, description)
        if(paymentPublicKey && paymentUtxo){
            this.checkPublicKey(paymentPublicKey, `${description} Payment Public Key`)
            this.validateUtxo(paymentUtxo, `${description} Payment Utxo`)
        }
    }

    validateIssuanceArgs (issuerPublicKey, contractUtxo, paymentPublicKey, paymentUtxo,  issueData, isSplittable, symbol, protocol) {
        const description =  'STAS Issue Function'
        this.checkPublicKey(issuerPublicKey, `${description} Issuer Public Key`)
        this.validateIssueData(issueData, description)
        this.validateUtxo(contractUtxo, `${description} Contract Utxo`)
        this.checkSplittableValue(isSplittable, protocol, description)
        this.validateTokenSymbol(symbol, description)
        this.validateSymbolMatch(contractUtxo, symbol, description)
        this.checkIfZeroFeeConditions(paymentPublicKey, paymentUtxo, description)
        if(paymentPublicKey && paymentUtxo){
            this.checkPublicKey(paymentPublicKey, `${description} Payment Public Key`)
            this.validateUtxo(paymentUtxo, `${description} Payment Utxo`)
        }  
    }

    validateTranferArgs (ownerPublicKey, stasUtxo, destinationAddress, paymentUtxo, paymentPublicKey) {
        const description = 'STAS Transfer Function'
        this.checkPublicKey(ownerPublicKey, `${description} Owner Public Key`)
        this.validateUtxo(stasUtxo, `${description} Stas Utxo`)
        this.checkDestinationAddress(destinationAddress, description)
        this.checkIfZeroFeeConditions(paymentPublicKey, paymentUtxo, description)
        if(paymentPublicKey && paymentUtxo){
            this.checkPublicKey(paymentPublicKey, `${description} Payment Public Key`)
            this.validateUtxo(paymentUtxo, `${description} Payment Utxo`)
        }     
    }

    validateSplitArgs (ownerPublicKey, stasUtxo, paymentPublicKey, paymentUtxo, splitDestinations) {
        const description = 'STAS Split Function'
        this.checkPublicKey(ownerPublicKey, `${description} Owner Public Key`)
        this.validateUtxo(stasUtxo, `${description} Stas Utxo`)
        this.validateSplitDestinations(splitDestinations, stasUtxo, 'split', description)
        this.checkIfZeroFeeConditions(paymentPublicKey, paymentUtxo, description)
        if(paymentPublicKey && paymentUtxo){
            this.checkPublicKey(paymentPublicKey, `${description} Payment Public Key`)
            this.validateUtxo(paymentUtxo, `${description} Payment Utxo`)
        }
    }

    validateMergeArgs (ownerPublicKey1, stasInput1, ownerPublicKey2,  stasInput2, destinationAddr, paymentPublicKey, paymentUtxo) {
        const description = 'STAS Merge Function'
        this.checkPublicKey(ownerPublicKey1, `${description} Owner Public Key`)
        this.checkPublicKey(ownerPublicKey2, `${description} Owner Public Key`)
        this.checkDestinationAddress(destinationAddr, description)
        this.validateMergeInputData(stasInput1)
        this.validateMergeInputData(stasInput2) 
        this.checkIfZeroFeeConditions(paymentPublicKey, paymentUtxo, description)
        if(paymentPublicKey && paymentUtxo){
            this.checkPublicKey(paymentPublicKey, `${description} Payment Public Key`)
            this.validateUtxo(paymentUtxo, `${description} Payment Utxo`)
        }
    }

    validateMergeSplitArgs (ownerPublicKey1, stasInput1, ownerPublicKey2,  stasInput2, splitDestinations, paymentPublicKey, paymentUtxo ) {
        const description = 'STAS Merge Split Function'
        this.checkPublicKey(ownerPublicKey1, `${description} Owner Public Key`)
        this.checkPublicKey(ownerPublicKey2, `${description} Owner Public Key`)
        const tokenUtxo = {script : bsv.Transaction(stasInput1.txHex).toObject().outputs[stasInput1.vout].script}
        this.validateSplitDestinations(splitDestinations, tokenUtxo, 'mergeSplit', description)
        this.validateMergeInputData(stasInput1)
        this.validateMergeInputData(stasInput2) 
        this.checkIfZeroFeeConditions(paymentPublicKey, paymentUtxo, description)
        if(paymentPublicKey && paymentUtxo){
            this.checkPublicKey(paymentPublicKey, `${description} Payment Public Key`)
            this.validateUtxo(paymentUtxo, `${description} Payment Utxo`)
        }
    }

    validateRedeemArgs (ownerPublicKey, stasUtxo, paymentPublicKey, paymentUtxo) {
        const description = 'STAS Redeem Function'
        this.checkPublicKey(ownerPublicKey, `${description} Owner Public Key`)
        this.validateUtxo(stasUtxo, `${description} Stas Utxo`)
        this.checkIfZeroFeeConditions(paymentPublicKey, paymentUtxo, description)
        if(paymentPublicKey && paymentUtxo){
            this.checkPublicKey(paymentPublicKey, `${description} Payment Public Key`)
            this.validateUtxo(paymentUtxo, `${description} Payment Utxo`)
        }
    }

    validateRedeemSplitArgs (ownerPublicKey, stasUtxo, paymentPublicKey, paymentUtxo, splitDestinations) {
        const description = 'STAS Redeem Split Function'
        this.checkPublicKey(ownerPublicKey, `${description} Owner Public Key`)
        this.validateUtxo(stasUtxo, `${description} Stas Utxo`)
        this.validateSplitDestinations(splitDestinations, stasUtxo, 'redeemSplit', description)
        this.checkIfZeroFeeConditions(paymentPublicKey, paymentUtxo, description)
        if(paymentPublicKey && paymentUtxo){
            this.checkPublicKey(paymentPublicKey, `${description} Payment Public Key`)
            this.validateUtxo(paymentUtxo, `${description} Payment Utxo`)
        }
    }

    validateCreateSwapArgs (ownerPublicKey, utxo, wantedData) {
        const description = 'STAS Create Swap Function'
        this.checkPublicKey(ownerPublicKey, `${description} Owner Public Key`)
        this.validateUtxo(utxo, `${description} Utxo`)
        this.validateWantedData(wantedData, description)
    }

    validateAcceptSwapArgs (offerTxHex, takerPublicKey, makerInputTxHex, takerInputTxHex, takerVout , paymentPublicKey, paymentUtxo) {
        const description = 'STAS Accept Swap Function'
        this.validateRawTx(offerTxHex)
        this.validateRawTx(takerInputTxHex)
        this.validateRawTx(makerInputTxHex)
        this.checkPublicKey(takerPublicKey, `${description} Owner Public Key`)
        this.checkIfZeroFeeConditions(paymentPublicKey, paymentUtxo, description)
        this.validateVout(takerVout, description)
        if(paymentPublicKey && paymentUtxo){
            this.checkPublicKey(paymentPublicKey, `${description} Payment Public Key`)
            this.validateUtxo(paymentUtxo, `${description} Payment Utxo`)
        }
    }

    validateSwapSignArgs (offerTxHex , takerInputTxHex, ownerPublicKey) {
        const description = 'STAS Sign Swap Function'
        this.validateRawTx(offerTxHex)
        this.validateRawTx(takerInputTxHex)
        this.checkPublicKey(ownerPublicKey, `${description} Owner Public Key`)
    }

    checkZeroChangeThreshold(utxoAmount, txCost, description) {
        const changeAmount = utxoAmount - txCost
        if(changeAmount > utility.ZEROCHANGETHRESHOLD){
            throw new Error(`${description} : Change amount is greater than zero change threshold : Change Amount ${changeAmount} , Threshold amount ${utility.ZEROCHANGETHRESHOLD}`);
        }
    }

    checkArray (array, description) {
        if( array === null || array.length === 0){
            throw new Error(`${description} : Array equal to null, undefined or not type of 'array'`);
        }   
    }

    checkPublicKey (publicKey, description) {
        if(!publicKey){
        throw new Error(`${description} : Invalid value for public key, received ${publicKey}`);
        }
    }

    checkDestinationAddress(address, description) {
        if(!address || typeof address!== 'string'){
            throw new Error(`${description} : Invalid value for destination address, received ${address}`);
        }
    }

    checkTokenSatoshis (tokenSatoshis, description) {
        if(typeof tokenSatoshis !== 'number' || tokenSatoshis <= 0 || !tokenSatoshis){
        throw new Error(`${description} : Invalid value for tokenSatoshis, received ${tokenSatoshis}`);
        }
    }

    checkTokenSatoshisWithAmounts (tokenSatoshis, tokenSchema, contractUtxo, description) {
        if (tokenSchema.satsPerToken > tokenSatoshis) {
            throw new Error(`${description} : Token satsPerToken in Satoshis of ${tokenSchema.satsPerToken} is greater than input amount of ${tokenSatoshis}`);
        }
        if (tokenSatoshis % tokenSchema.satsPerToken !== 0) {
            throw new Error(`${description} : Token amount ${tokenSatoshis} must be divisible by satsPerToken ${tokenSchema.satsPerToken}`);
        }
        if (tokenSatoshis > contractUtxo.satoshis) {
            throw new Error(`${description} : Token Supply in Satoshis of ${tokenSatoshis} is greater than input amount of ${contractUtxo.satoshis}`);
        }
    }

    checkTokenIdMatchesIssuerPkh (tokenId, issuerPublicKeyHash, description) {
        if (tokenId!== issuerPublicKeyHash) {
            throw new Error(`${description} : Token Id ${tokenId} does not match Issuer Pkh ${issuerPublicKeyHash}`);
        }
    }

    validateUtxo (utxo, description) {
        if (!utxo|| typeof utxo!== 'object') {
            throw new Error(`${description}  : Invalid value for utxo`);
        }
        if(typeof utxo.satoshis !== 'number') {
            throw new Error(`${description} : Expected number value for satoshis but got ${utxo.satoshis}`);
        } else if (typeof utxo.script !== 'string'){
            throw new Error(`${description} : Expected string value for script but got ${utxo.script}`);
        } else if (typeof utxo.vout !== 'number' && utxo.vout < 0){
            throw new Error(`${description} : Expected Number value for vout but got ${utxo.vout}`)
        } else if(typeof utxo.txid !== 'string'){
            throw new Error(`${description} : Expected string value for txid but got ${utxo.txid}`)
        }       
    }

    validateIssueData (issueData, description) {
        if (!issueData  || !issueData.length) {
            throw new Error(`${description} Issue Data  : Array equal to null or undefined`);
        }
        for(const data of issueData) {
            if(!data.addr){
                throw new Error(`${description} : Issue data must have an address`);
            }
            if(data.addr.length < this.utility.ADDRESS_MIN_LENGTH || data.addr.length > this.utility.ADDRESS_MAX_LENGTH){
                throw new Error(`${description} : Invalid address, length must be between  ${this.utility.ADDRESS_MIN_LENGTH} and ${this.utility.ADDRESS_MAX_LENGTH}, received ${data.addr}`);
            }
            if(!data.satoshis){
                throw new Error(`${description} : Issue data must have a satoshis`);
            }
            if(typeof data.satoshis !== 'number' || data.satoshis <= 0 ) {
                throw new Error(`${description} : Issue data must have a satoshis value greater than 0 and must be a natural number but got ${data.satoshis}`);
            }
        }
    }

    validateSymbolMatch(contractUtxo, symbol, description) {
        if(this.stasUtils.getSymbolFromContract(contractUtxo.script) !== symbol) {
            throw new Error(`${description} : Invalid symbol, received "${symbol}" does not match contract schema symbol "${this.stasUtils.getSymbolFromContract(contractUtxo.script)}"`);
        }
    }

    validateTokenSymbol(symbol, description) {       
        if(!symbol){
            throw new Error(`${description} : Token symbol is not defined`);
                
        }
        if(symbol.length < this.utility.MIN_SYMBOL_LENGTH || symbol.length > this.utility.MAX_SYMBOL_LENGTH){
            throw new Error(`${description} : Invalid symbol, length must be between  ${this.utility.MIN_SYMBOL_LENGTH} and ${this.utility.MAX_SYMBOL_LENGTH}, received ${symbol}`);
        }
        const reg = /^[\w-]+$/
        const res = reg.test(symbol)
        if(!res) {
            throw new Error(`${description} : Invalid symbol received ${symbol}. Must be type string with alpahnumeric characters or '-' & '_' `);
        }      
    }

    isScriptSplittable(script, description) {
         if(!this.stasUtils.isSplittable(script)){
            throw new Error(`${description} : This script is not splittable and cannot be used in this function`);    
         }
    }

    validateMergeInputData(stasData, description) {
        if(!stasData || typeof stasData !== 'object'){
            throw new Error(`${description} : Invalid value for stasData, received ${stasData}`)
        } else if (typeof stasData.txHex !== 'string'){
           throw new Error(`${description} : Invalid value for txHex, received ${stasData.txHex}`)
        } else if(typeof stasData.vout !== 'number' && stasData.vout < 0){
            throw new Error(`${description} : Invalid value for vout, received ${stasData.vout}`)
        }  
    }

    validateSplitDestinations(splitDestinations, tokenUtxo, txType, description) { 
        const throwSplitDestErr = (description, maxSplits) => {
            throw new Error(`${description} : Max number of splitDestinations is ${maxSplits}, received ${splitDestinations.length}`)
        }
        this.checkArray(splitDestinations, `${description} splitDestinations `);
        const isStas50 = this.stasUtils.checkIfStas50(tokenUtxo.script)
        if(txType === 'split' || txType === 'mergeSplit'){
            if(isStas50){
                if(splitDestinations.length > 50){
                    throwSplitDestErr(`Transaction ${txType} using token protocol STAS50`, 50)
                }
            } else {
                if(splitDestinations.length > 4){
                    throwSplitDestErr(`Transaction ${txType}`, 4)
                }
            }
        } else if(txType === 'swap'){
            if(isStas50){
                if(splitDestinations.length > 48){
                    throwSplitDestErr(`Transaction ${txType} using token protocol STAS50`, 48)
                }
            } else {
                if(splitDestinations.length > 2){
                    throwSplitDestErr(`Transaction ${txType}`, 2)
                }
            }

        } else if (txType === 'redeemSplit'){
            if(isStas50){
                if(splitDestinations.length > 49){
                    throwSplitDestErr(`Transaction ${txType} using token protocol STAS50`, 49)
                }
            } else {
                if(splitDestinations.length > 3){
                    throwSplitDestErr(`Transaction ${txType}`, 3)
                }
            }
        }
        for(const destination of splitDestinations){
            this.checkDestinationAddress(destination.address, description)
            if(typeof destination.satoshis !== 'number' || destination.satoshis <= 0 || !destination.satoshis){
                throw new Error(`${description} : Invalid value for satoshis, received ${destination.satoshis}`)
            }
        }
    }

    checkIfZeroFeeConditions(paymentPublicKey, paymentUtxo, description) {
        if(paymentPublicKey && !paymentUtxo) {
            throw new Error(`${description} : Payment key provided but payment utxo equals null ! `);

        } else if (!paymentPublicKey && paymentUtxo) {
            throw new Error(`${description} : Payment utxo provided but payment key equals null ! ` )
        }
    }

    validateRawTx(rawTx, description){
        if(!bsv.Transaction(rawTx)){
            throw new Error(`${description} : Not a valid Raw transaction Hex`)
        }
    }

    validateSchema (tokenSchema) {
        if (!tokenSchema) {
           throw new Error(` Token Schema is not defined ! `);
        } 
        if (!tokenSchema.symbol || typeof tokenSchema.symbol !== 'string') {   
            throw new Error(`Invalid symbol :  Must be a string, received ${tokenSchema.symbol}`);
        }
        if (!tokenSchema.satsPerToken || tokenSchema.satsPerToken <= 0 || typeof tokenSchema.satsPerToken !== 'number'){
            throw new Error(`Invalid satsPerToken. Must be greater than 0 and whole number , received ${tokenSchema.satsPerToken}`);
        }
        if (!tokenSchema.tokenId || typeof tokenSchema.tokenId !== 'string') {
            throw new Error(`Invalid tokenId. Must be a string, received ${tokenSchema.tokenId}`);
        }
        if (!tokenSchema.totalSupply || typeof tokenSchema.totalSupply !== 'number') {
            throw new Error(`Invalid totalSupply. Must be a whole number, received ${tokenSchema.totalSupply}`);
        }       
    }

    checkSplittableValue (isSplittable, protocol){  
         if(protocol === 'STAS' || protocol === 'STAS-50' || protocol=== 'STAS-0'){
            if( typeof isSplittable !== 'boolean'){
                throw new Error(`Invalid value for isSplittable. Must be a boolean, received type ${typeof isSplittable}`);
             }
         }    
         if(!protocol || typeof protocol!== 'string'){
            throw new Error(`Invalid value for protocol. Must be a string, received type ${typeof protocol}`);
         }
         if(protocol !== 'STAS-789' && protocol !== 'STAS-20' && protocol !== 'STAS' && protocol!== 'STAS-50' && protocol!== 'STAS-0'){
            throw new Error(`Protocol type ${protocol} is not supported`); 
         }
    }

    checkDataElement (data, description) {
        if(typeof data !== 'string'){
           throw new Error(`${description} : Invalid value for data, received ${data}`)
        }
    }

    validateWantedData (wantedData, description) {
        if(!wantedData){
          throw new Error(`${description} : Wanted data is not defined`);   
        } else if(typeof wantedData !== 'object'){
            throw new Error(`${description} : Invalid value for wantedData, received ${wantedData}`)
        } else  if (typeof wantedData.satoshis !== 'number' && wantedData.satoshis <= 0){
            throw new Error(`${description} : Invalid value for satoshis, received ${wantedData.satoshis}`)
        }   
    }

    validateVout(vout, description) {
        if(vout === undefined || vout < 0){
            throw new Error(`${description} : Invalid value for vout, received ${vout}`)      
        }
    }

    checkDestinationAddressCondition(issuerPublicKeyHash, destinationPublicKeyHash, isStas20) {
        if (issuerPublicKeyHash === destinationPublicKeyHash && !isStas20) {
            throw new Error('Token UTXO cannot be sent to issuer address')
        }
    }

    checkStas20RedeemAddressMatch(ownerPublicKeyHash, redeemAddr){
        if (ownerPublicKeyHash!== redeemAddr) {
            throw new Error('STAS-20 Token UTXO can only be redeemed by issuer address')
        }
    }

    swapTakerAmountCheck(takerInputAmount, makerWantedAmount, totalExtraOutputAmount){
        const totalOutputAmount = makerWantedAmount + totalExtraOutputAmount
        if(takerInputAmount - totalOutputAmount !== 0){
            throw new Error(`Atomic swap : Taker input amount must match output amounts not including fees. Provided Input Amount ${takerInputAmount}, total output amount is ${totalOutputAmount}`)
        }
    }
    
}

module.exports = new Errors()