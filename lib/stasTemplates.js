const bsv = require('bsv')
const utility = require('./utility')
const constants = require('./constants')
const {STAS, STAS50, STAS20, STAS789, STASPREFIX, STAS50PREFIX, STAS789PREFIX, STAS20PREFIX} = require('./scripts/stasScripts')

/*
Proprietary Script License
Copyright (c) 2023 STAS
The proprietary scripts located in the /scripts folder within this repository are not covered by the MIT License. They are subject to a separate commercial license, which can be accessed at stastoken.com/terms.
These proprietary scripts are protected by copyright law and may not be used, copied, modified, merged, published, distributed, sublicensed, and/or sold without obtaining the appropriate commercial license.
For more information and to obtain the required commercial license, please visit stastoken.com/terms.
*/
class StasUtils {
  constructor() {
    this.stasTemplate = STAS,
    this.stas50Template = STAS50,
    this.stas789Template = STAS789,
    this.stas20Template = STAS20,

    this.stasPrefix = STASPREFIX,
    this.stas50Prefix = STAS50PREFIX,
    this.stas789Prefix = STAS789PREFIX,
    this.stas20Prefix = STAS20PREFIX,

    this.stasFlagsDataRegex = /OP_RETURN [0-9a-fA-F]{40} (00|01)([\s]?[\S]*[\s]?)([a-f0-9]*)+$/,
    this.stasNoFlagsDataRegex = /OP_RETURN [0-9a-fA-F]{40} ([\s]?[\S]*[\s]?)([a-f0-9]*)/,
    this.stasScriptOwnerUpdateRegex = /^(76a914)([a-z0-9]{40})*(88ac697[a-z0-9]*)/;
    this.utility = utility;
  }

  /**
     * Will append new token owner public key has to an existing STAS script
     * @param {string} destinationPublicKeyHash - new destination public key hash value
     * @param {string} script - current token script
     * @return {string} - hex string with updated owner
     */
  updateStasScript(destinationPublicKeyHash, script) {
    return `76a914${destinationPublicKeyHash}88ac${script.slice(50)}`;
  }

  /**
   * Will format an array of data strings into hexadecimal chunks for ASM format
   * Any string that represents an OP code value will be converted to its hexadecimal representation
   * @param {array} data - data array containing string values
   * @return {string} returns ASM string representation with OP code conversion
   */
  formatDataToAsmWithOpCodeConversion (data) {
    let asm = "" 
    for (const el of data) {
      if (constants.opCodes.hasOwnProperty(el)) {
        asm += constants.opCodes[el]
      } else {
        asm += Buffer.from(el).toString("hex")
      }
      asm += " "
    }
    return asm.trim();
  };

  /**
   * Will format an array of data strings into hexadecimal chunks for ASM format
   * Any string that represents an OP code value will be converted to its hexadecimal representation
   * @param {array} data - data array containing string values
   * @return {string} returns Hex string representation with OP code conversion
   */
  formatDataToHexStringWithOpCodeConversion (data) {
    const res = this.formatDataToAsmWithOpCodeConversion(data)
    return bsv.Script.fromASM(res).toHex()
  };


  /**
     * Will format an array of data strings into hexadecimal chunks for ASM format
     * @param {array} data - data array containing string values
     * @return {string} returns ASM string representation
     */
  formatDataToAsm(data) {
    return data.map((s) => Buffer.from(s).toString('hex')).join(' ');
  }


  /**
   * Will convert ASM string representation to hexadecimal string
   * @param {string} data -ASM string representation
   * @return {string} returns Hex string
   */
  formatAsmToHexString(data) {
    return bsv.Script.fromASM(data).toHex()
  }

  /**
     * Will format an array of data strings into a single hex string representation
     * @param {array} data - data array containing string values
     * @return {string} returns hex string representation
     */
  formatDataToHex(data) {
    const dataTx = bsv.Transaction().addSafeData(data);
    return bsv.Script.fromBuffer(dataTx.outputs[0]._scriptBuffer.slice(2)).toHex();
  }

  /**
     * Will add new data hex to script hex
     * @param {string} script - hex format of the script
     * @param {string} data - hex format of the data
     * @return {string} returns hex string with data added to the script
     */
  appendTokenData(script, data) {
    return script += data;
  }

  /**
     * * Will determine if STAS script is type STAS-789 template
     * @param {string} script - hex representation of the STAS script
     * @return {boolean} - true if the script matches the STAS-789 prefix
     */
  checkIfStas789(script) {
    if (script.includes(this.stas789Prefix)) {
      return true;
    } else {
      return false;
    }
  }

  /**
     * Will determine if STAS script is type STAS-20 template
     * @param {string} script - hex representation of the STAS script
     * @return {boolean} - true if the script matches the STAS-20 prefix
     */
  checkIfStas20(script) {
    if (script.includes(this.stas20Prefix)) {
      return true;
    } else {
      return false;
    }
  }

  /**
     * Will determine if STAS script is type STAS-50 template
     * @param {string} script - hex representation of the STAS script
     * @return {boolean} - true if the script matches the STAS-50 prefix
     */
  checkIfStas50(script) {
    if (script.includes(this.stas50Prefix)) {
      return true;
    } else {
      return false;
    }
  }

  /**
     * Will determine if STAS script is type STAS legacy template
     * @param {string} script - hex representation of the STAS script
     * @return {boolean} - true if the script matches the STAS legacy prefix
     */
  checkIfStasLegacy(script) {
    if (script.includes(this.stasPrefix)) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Parse the token data segments from a token script.
   * @param {string} script - The token script.
   * @return {Promise<string[]>} - An array of token data segments.
   */
  async parseTokenData(script) {
    let dataIndex = 4;
    if (script.includes(this.stas789Prefix) || script.includes(this.stas20Prefix)) {
      dataIndex = 3;
    }
    const dataSegments = [];
    const asm = bsv.Script.fromHex(script).toASM();
    const data = asm.split('OP_RETURN')[1];
    const allData = data.split(' ').slice(dataIndex);
    allData.forEach((e) => {
      dataSegments.push(utility.hexToAscii(e));
    });
    return dataSegments;
  }

  /**
     * Will return the flags value of the STAS script where present
     * @param {string} script - hex representation of the STAS script
     * @return {(string|null)} - if the script is valid STAS type that contains flags it will return flag value of "00" or "01" or else null
     */
  getScriptFlags(script) {
    if (script.includes(this.stasPrefix) || script.includes(this.stas50Prefix)) {
      const asm = bsv.Script.fromHex(script).toASM();
      const data = asm.split('OP_RETURN')[1];
      const flag = data.split(' ')[2];
      return flag;
    } else {
      return null;
    }
  }

  /**
     * Gets redeem address from the STAS script
     * @param {string} script - hex representation of the STAS script
     * @return {string} publicKeyHash - represents the redeem address of the token script
     */
  getRedeemPublicKeyHash(script) {
    const asm = bsv.Script.fromHex(script).toASM();
    const data = asm.split('OP_RETURN')[1];
    const publicKeyHash = data.split(' ')[1];
    return publicKeyHash;
  }

  /**
     * Gets the token symbol from the STAS script
     * @param {string} script - hex representation of the STAS script
     * @return {(string|null)} will return the token symbol or null
     */
  getSymbol(script) {
    let dataIndex = 3;
    if (script.includes(this.stas789Prefix) || script.includes(this.stas20Prefix)) {
      dataIndex = 2;
    }
    const asm = bsv.Script.fromHex(script).toASM();
    const data = asm.split('OP_RETURN')[1];
    const symbol = data.split(' ').slice(dataIndex, dataIndex + 1);
    return utility.hexToAscii(symbol);
  }

  /**
     * Will return boolean value if the STAS script is of splittable type
     * @param {string} script - hex representation of the STAS script
     * @return {boolean} - will return return if STAS script is of splittable type
     */
  isSplittable(script) {
    let isSplittable;
    if (script.includes(this.stasPrefix) || script.includes(this.stas50Prefix)) {
      const flags = this.getScriptFlags(script);
      if (flags === '01') {
        isSplittable = false;
      } else {
        isSplittable = true;
      }
    } else {
      if (script.includes(this.stas20Prefix)) {
        isSplittable = true;
      } else {
        isSplittable = false;
      }
    }
    return isSplittable;
  }

  /**
     * Will determine if the script hex value is a valid STAS script that is being used in this library
     * @param {string} script - hex representation of the STAS script
     * @return {boolean} - true if the script is of an existing STAS script used in this library
     */
  isStasScript(script) {
    if (script.includes(this.stasPrefix) || script.includes(this.stas50Prefix) || script.includes(this.stas20Prefix) || script.includes(this.stas789Prefix)) {
      return true;
    }
    return false;
  }

  /**
     * Will get the token symbol from the contract script string
     * @param {string} contractScript - stringified contract script containing the token details
     * @return {string} - will return token symbol string where present
     */
  getSymbolFromContract(contractScript) {
    const startIndex = contractScript.indexOf('7b22');
    if (startIndex === -1) {
      console.error('Could not find token symbol in contract script');
      return undefined;
    }
    const or = contractScript.substring(startIndex);
    const schemaBuf = Buffer.from(or, 'hex');
    const schema = JSON.parse(schemaBuf.toString());
    if (!schema || !schema.symbol) {
      console.error('Could not parse schema or symbol from contract script');
      return undefined;
    }
    return schema.symbol;
  }

  /**
     * Will build a token script for issuance based on the arguements added into the function
     * @param {string} destinationPublicKeyHash - The owner of the STAS script being created
     * @param {string} redemptionPublicKey - the public key of the STAS token issuer
     * @param {string} data - the token meta data added to the end of the script
     * @param {boolean} isSplittable - will provide boolean in reference to the flags value added to the script where applicable
     * @param {string} symbol - token symbol that will be embeded in the STAS script
     * @param {string} protocol - will identify the STAS template being used
     * @return {string} - will return the STAS token script in ASM format
     */
  getStasProtocolScript(destinationPublicKeyHash, redemptionPublicKey, data, isSplittable, symbol, protocol) {
    protocol = protocol.toUpperCase();
    const redemptionPublicKeyHash = this.utility.getPKHfromPublicKey(redemptionPublicKey);
    let script;
    if (protocol === 'STAS' || protocol === 'STAS-0') {
      script = this.stasTemplate.replace('[destinationPublicKeyHash]', destinationPublicKeyHash).replace('[redemptionPublicKeyHash]', redemptionPublicKeyHash);
    }
    if (protocol === 'STAS-50') {
      script = this.stas50Template.replace('[destinationPublicKeyHash]', destinationPublicKeyHash).replace('[redemptionPublicKeyHash]', redemptionPublicKeyHash);
    }
    if (protocol === 'STAS-789') {
      script = this.stas789Template.replace('[destinationPublicKeyHash]', destinationPublicKeyHash).replace('[redemptionPublicKeyHash]', redemptionPublicKeyHash);
    }
    if (protocol === 'STAS-20') {
      script = this.stas20Template.replace('[destinationPublicKeyHash]', destinationPublicKeyHash).replace('[redemptionPublicKeyHash]', redemptionPublicKeyHash);
    }

    let asm = '';
    if (protocol === 'STAS' || protocol === 'STAS-50' || protocol === 'STAS-0') {
      if (isSplittable) {
        asm += '00 ';
      } else {
        asm += '01 ';
      }
    }

    if (symbol) {
      asm += `${symbol}`;
    }
    if (data) {
      asm += ` ${data}`;
    }
    const scriptBuf = bsv.Script.fromASM(asm);
    const scriptHex = scriptBuf.toHex();
    script += scriptHex;
    return script;
  }


  // SIGNED VERSION - NOT CURRENTLY USED
  /**
     * Will create and sign the unlocking script for the STAS script
     * @param {object} tx - whole transaction object
     * @param {array} outputs - an array of all the outputs in the transaction using minimal data {satoshis : number, publicKeyHash : string}
     * @param {object} sigString - signature for the unlocking script
     * @param {string} pubKeyString - public key string used for the signature verification process
     * @param {boolean} isStas789 - determines if STAS script is type STAS-789
     * @param {boolean} isStas20 - determines if STAS script is type STAS-20
     * @param {string} data - hex representation of data that can be used for certain STAS token types
     * @param {boolean} isZeroFee - will determine if the unlocking script will contain a fee input and a change output
     * @param {boolean} isZeroChange - will determine if the unlocking script will contain a change output
     * @return {string} - will return the signed unlocking script in ASM format
     */
  buildUnlockingScript(tx, outputs, sigString, pubKeyString, isStas789, isStas20, data, isZeroFee, isZeroChange) {
    let scriptData;
    if (isStas789 || isStas20) {
      if (data && data !== `` && data !== undefined) {
        scriptData = `${data} `;
      } else {
        scriptData = `OP_FALSE `;
      }
    }

    let unlockScript = ``;
    for (let i = 0; i < outputs.length; i++) {
      const output = outputs[i];
      unlockScript += `${this.utility.convertToLESM(output.satoshis)} ${Buffer.from(output.publicKeyHash)} `;
      if (isStas789 && i === 0) {
        unlockScript += `${scriptData}`;
      }
    }

    if (isZeroFee) {
      unlockScript += `OP_FALSE OP_FALSE `;
      if (isStas20) {
        unlockScript += scriptData;
      }
      unlockScript += `OP_FALSE OP_FALSE `;
    } else {
      if (isZeroChange) {
        unlockScript += `OP_FALSE OP_FALSE `;
      }
      if (isStas20) {
        unlockScript += scriptData;
      }
      const outpointFundingIndex = tx.inputs[tx.inputs.length - 1].outputIndex;
      const reversedFundingTXID = this.utility.convertToReverseEndian(tx.inputs[tx.inputs.length - 1].prevTxId);
      unlockScript += `${this.utility.convertToLESM(outpointFundingIndex)} ${Buffer.from(reversedFundingTXID)}`;
    }

    unlockScript += ` OP_0 ${bsv.Transaction.sighash.sighashPreimage(tx, this.utility.SIGHASH, 0, tx.inputs[0].output.script, tx.inputs[0].output.satoshisBN).toString('hex')} ${sigString} ${pubKeyString}`;
    return unlockScript;
  }


  // UNSIGNED VERSION
  /**
     * Will create the unsigned part of the unlocking script for the STAS script
     * @param {object} tx - whole transaction object
     * @param {array} outputs - an array of all the outputs in the transaction using minimal data {satoshis : number, publicKeyHash : string}
     * @param {boolean} isStas789 - determines if STAS script is type STAS-789
     * @param {boolean} isStas20 - determines if STAS script is type STAS-20
     * @param {string} data - hex representation of data that can be used for certain STAS token types
     * @param {boolean} isZeroFee - will determine if the unlocking script will contain a fee input and a change output
     * @param {boolean} isZeroChange - will determine if the unlocking script will contain a change output
     * @return {string} - will return the unsigned unlocking script in ASM format
     */
  async buildUnlockingScriptUnsigned(tx, outputs, isStas789, isStas20, data, isZeroFee, isZeroChange) {
    let scriptData = ``;
    if (isStas789 || isStas20) {
      if (data && data !== `` && data !== undefined) {
        scriptData += `${data} `;
      } else {
        scriptData += `OP_FALSE `;
      }
    }

    let unlockScript = ``;
    for (let i = 0; i < outputs.length; i++) {
      const output = outputs[i];
      unlockScript += `${this.utility.convertToLESM(output.satoshis)} ${Buffer.from(output.publicKeyHash)} `;
      if (isStas789 && i === 0) {
        unlockScript += `${scriptData}`;
      }
    }

    if (isZeroFee) {
      unlockScript += `OP_FALSE OP_FALSE `;
      if (isStas20) {
        unlockScript += scriptData;
      }
      unlockScript += `OP_FALSE OP_FALSE `;
    } else {
      if (isZeroChange) {
        unlockScript += `OP_FALSE OP_FALSE `;
      }
      if (isStas20) {
        unlockScript += scriptData;
      }
      const outpointFundingIndex = tx.inputs[tx.inputs.length - 1].outputIndex;
      const reversedFundingTXID = this.utility.convertToReverseEndian(tx.inputs[tx.inputs.length - 1].prevTxId);
      unlockScript += `${this.utility.convertToLESM(outpointFundingIndex)} ${Buffer.from(reversedFundingTXID)}`;
    }

    unlockScript += ` OP_0 ${bsv.Transaction.Sighash.sighashPreimage(tx, this.utility.SIGHASH, 0, tx.inputs[0].output.script, tx.inputs[0].output.satoshisBN).toString('hex')}`;
    return unlockScript;
  }


  /**
 * Will create the unsigned part of the unlocking script for the STAS script
    * @param {object} tx - whole transaction object
    * @param {object} stasUtxo - contains STAS utxo information to create the unlocking script
    * @param {array} outputData - an array of all the outputs in the transaction using minimal data {satoshis : number, publicKeyHash : string}
    * @param {string} preImage - string representing the preimage of the transaction
    * @param {object} paymentUtxo - contains the payment UTXO values for the unlocking script build {vout : number, txid : string}
    * @param {boolean} isStas20 - determines if STAS script is type STAS-20
    * @param {string} data - hex representation of data that can be used for certain STAS token types
    * @param {boolean} isZeroChange - will determine if the unlocking script will contain a change output
    * @param {boolean} isZeroFee - will determine if the unlocking script will contain a fee input and a change output
    * @return {string} - will return the unsigned unlocking script in ASM format
    */
  async buildMergeUnlockingScript(tx, stasUtxo, outputData, preImage, paymentUtxo, isStas20, data, isZeroChange, isZeroFee) {
    let scriptData = ``;
    if (isStas20) {
      if (data && data !== `` && data !== undefined) {
        scriptData += `${data} `;
      } else {
        scriptData += `OP_FALSE `;
      }
    }

    let customScript = ``;
    if (isZeroFee) {
      customScript += `OP_FALSE OP_FALSE `;
      if (isStas20) {
        customScript += scriptData;
      }
      customScript += `OP_FALSE OP_FALSE `;
    } else {
      if (isZeroChange) {
        customScript += `OP_FALSE OP_FALSE `;
      }
      if (isStas20) {
        customScript += scriptData;
      }
      if (isZeroChange) {
        customScript += `${this.utility.convertToLESM(paymentUtxo.vout)} ${this.utility.convertToReverseEndian(paymentUtxo.txid)} `;
      }
    }

    let outputScript = ``;
    for (let i = 0; i < outputData.length; i++) {
      outputScript += `${this.utility.convertToLESM(tx.outputs[i].satoshis)} ${outputData[i].publicKeyHash} `;
    }

    let unlockingScript = ``;
    if (isZeroFee || isZeroChange) {
      unlockingScript += `${outputScript}${customScript}${this.utility.convertToLESM(stasUtxo.vout)} ${stasUtxo.scriptPiece} ${this.utility.convertToLESM(stasUtxo.pieceCount)} ${preImage}`;
    } else {
      unlockingScript += `${outputScript}${scriptData}${this.utility.convertToLESM(paymentUtxo.vout)} ${this.utility.convertToReverseEndian(paymentUtxo.txid)} ${this.utility.convertToLESM(stasUtxo.vout)} ${stasUtxo.scriptPiece} ${this.utility.convertToLESM(stasUtxo.pieceCount)} ${preImage}`;
    }

    return unlockingScript;
  }
}

module.exports = new StasUtils();