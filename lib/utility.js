const bsv = require('bsv')
const BN = bsv.crypto.BN
class Utility {
    constructor() {
      this.SATS = 50; // Don't change this setting unless you know what you're doing
      this.PERBYTE = 1000; // Don't change this setting unless you know what you're doing
      this.ZEROCHANGETHRESHOLD = 10; // Don't change this setting unless you know what you're doing
      this.FLAGS = bsv.Script.Interpreter.SCRIPT_ENABLE_SIGHASH_FORKID | bsv.Script.Interpreter.SCRIPT_ENABLE_MAGNETIC_OPCODES | bsv.Script.Interpreter.SCRIPT_ENABLE_MONOLITH_OPCODES;
      this.SIGHASH = bsv.crypto.Signature.SIGHASH_ALL | bsv.crypto.Signature.SIGHASH_FORKID;
      this.SIGHASH_SINGLE = bsv.crypto.Signature.SIGHASH_SINGLE | bsv.crypto.Signature.SIGHASH_ANYONECANPAY | bsv.crypto.Signature.SIGHASH_FORKID;
      this.P2PKH_UNLOCKING_SCRIPT_BYTES = 107;
      this.MIN_SYMBOL_LENGTH = 1;
      this.MAX_SYMBOL_LENGTH = 128;
      this.SATS_PER_BITCOIN = 1e8;
      this.ADDRESS_MIN_LENGTH = 26;
      this.ADDRESS_MAX_LENGTH = 35;
    }
  
    /**
       * Will convert regular number to endian format
       * @param {number} num - number wanted to be converted to endian format
       * @return {string} - hex string format
       */
    int2SM(num) {
      const n = BN.fromNumber(num);
      const m = n.toSM({endian: 'little'} );
      return m.toString('hex');
    }
  
    /**
       * Will convert regular number to endian format or ASM
       * @param {number} num  number wanted to be converted to endian format or ASM
       * @return {string} will either be ASM or endian string value
       */
    numberToLESM(num) {
      if (num < 17) {
        return `OP_${num}`;
      } else {
        const n = bsv.crypto.BN.fromNumber(num);
        return n.toSM({endian: 'little'}).toString('hex');
      }
    }
  
    /**
       * Will return the public key hash associated with the give address string
       * @param {string} addr - address string to convert to public key hash
       * @return {string} - public key hash of the address string
       */
    addressToPKH(addr) {
      if (typeof addr === 'string') {
        addr = bsv.Address.fromString(addr);
      }
      return addr.toJSON().hash;
    }
  
    /**
       * Will return the public key from the privay value provided
       * @param {string/object} privateKey - private key value as string or object
       * @return {string} - will return the public key string in hexadecimal format
       */
    getPublicKeyStringFromPrivateKey(privateKey) {
      if (typeof privateKey !== 'string') {
        privateKey = privateKey.toString();
      }
      privateKey = bsv.PrivateKey.fromString(privateKey);
      return bsv.PublicKey.fromPrivateKey(privateKey).toString('hex');
    }
  
    /**
       * Will return the public key hash from a public key string or object
       * @param {string/object} publicKey - public key value as string or object
       * @return {string} - will return the public key hash string in hexadecimal format
       */
    getPKHfromPublicKey(publicKey) {
      if (typeof publicKey === 'string') {
        publicKey = bsv.PublicKey.fromString(publicKey);
      }
      return bsv.crypto.Hash.sha256ripemd160(publicKey.toBuffer()).toString('hex');
    }
  
    /**
       * Will build a pay to public key hash output script from a public key hash string
       * @param {string} pkh - public key hash string
       * @return {string} - will return a pay to public key hash output script
       */
    buildP2pkhOutputScript(pkh) {
      return bsv.Script.fromASM(`OP_DUP OP_HASH160 ${pkh} OP_EQUALVERIFY OP_CHECKSIG`);
    }
  
    /**
       * Will convert a hexadecimal string to ASCII format.
       * @param {string} str1 - hexadecimal string value wanted to convert to ASCII
       * @return {string} - ASCII data representation
       */
    hexToAscii(str1) {
      const hex = str1.toString();
      let str = '';
      for (let n = 0; n < hex.length; n += 2) {
        str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
      }
      return str;
    }
  
    /**
       * Will convert ASCII to hex representation
       * @param {string} str - string in ASCII representation
       * @return {string} - hexadecimal representation
       */
    asciiToHex(str) {
      const arr1 = [];
      for (let n = 0, l = str.length; n < l; n++) {
        const hex = Number(str.charCodeAt(n)).toString(16);
        arr1.push(hex);
      }
      return arr1.join('');
    }
  
    /**
       * Will covvert hexadecimal string representation to reverse endian representation
       * @param {string} str - hex string value
       * @return {string} reverse endian representation
       */
    reverseEndian(str) {
      const num = new BN(str, 'hex');
      const buf = num.toBuffer();
      return buf.toString('hex').match(/.{2}/g).reverse().join('');
    }
  
    /**
       * Replace values within a string value
       * @param {string} string - value to convert
       * @param {string} search - part to find
       * @param {string} replace - part to replace
       * @return {string} - value that has been altered based on the arguement values
       */
    replaceAll(string, search, replace) {
      const pieces = string.split(search);
      return pieces.join(replace);
    }
  
    /**
       * Will determine if a script hexadecimal value is a pay to public key hash value
       * @param {string} script - script hexadecimal value
       * @return {boolean} - will return true if script is a pay to public key hash value
       */
    isP2pkhScript(script) {
      return bsv.Script.fromHex(script).isPublicKeyHashOut();
    }
  
    /**
       * Will return an address from a script hexadecimal value or script buffer
       * @param {string/object} script - hexadecimal value or script buffer
       * @return {string} - address string
       */
    getAddressFromP2pkhOut(script) {
      if (typeof script === 'string') {
        script = bsv.Script.fromHex(script);
      }
      return bsv.Address.fromScript(script).toString();
    }
  
    /**
       * Will return the public key has from a script hexadecimal value or script buffer
       * @param {string/object} script - hexadecimal value or script buffer
       * @return {string} - public key hash string value
       */
    getPkhFromP2pkhOut(script) {
      if (typeof script !== 'string') {
        script = script.toString('hex');
      }
      return script.slice(6, 46);
    }
  
    /**
       * Will determine if paymentUtxo exists
       * @param {object} paymentUtxo - UTXO object
       * @return {boolean} - will return true if UTXO exists
       */
    checkIfZeroFee(paymentUtxo) {
      if (paymentUtxo === null || paymentUtxo === undefined || !paymentUtxo) {
        return true;
      } else {
        return false;
      }
    }
  
  
    /**
       * Will return the UTXO based on the index and the transaction values provided
       * @param {string} tx - transaction hex format
       * @param {number} index - index of transaction output for the
       * @return {object} - UTXO based on the index value in the transaction
       */
    getUtxoFromTx(tx, index) {
      const txObj = bsv.Transaction(tx).toObject();
      return {
        txid: txObj.hash,
        vout: index,
        script: txObj.outputs[index].script,
        satoshis: txObj.outputs[index].satoshis,
      };
    }
}
  
module.exports = new Utility()

