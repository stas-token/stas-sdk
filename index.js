'use strict'


const stasLib = {}

stasLib.stasIssuance = require('./lib/stasIssuance')
stasLib.stasContract = require('./lib/stasContract')
stasLib.stasTransfer = require('./lib/stasTransfer')
stasLib.stasSplit = require('./lib/stasSplit')
stasLib.stasRedeem = require('./lib/stasRedeem')
stasLib.stasRedeemSplit = require('./lib/stasRedeemSplit')
stasLib.stasMerge = require('./lib/stasMerge')
stasLib.stasMergeSplit = require('./lib/stasMergeSplit')
stasLib.stasCreateSwap = require('./lib/stasCreateSwap')
stasLib.stasAcceptSwap = require('./lib/stasAcceptSwap')
stasLib.stasSignSwap = require('./lib/stasSignSwap')
stasLib.stasTemplates = require('./lib/stasTemplates')
stasLib.utility = require('./lib/utility')
stasLib.stasFeeEstimates = require('./lib/stasFeeEstimates')
stasLib.tokenSchemaTemplate = require('./lib/tokenSchemaTemplate')



module.exports = stasLib