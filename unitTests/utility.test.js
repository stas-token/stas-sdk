const {expect} = require('chai');
const bsv = require('bsv');
const utility = require('../lib/utility');
const dummyData = require('./dummyData');


describe('utility.js file Testing', function() {
  describe('int2SM small input', function() {
    const res = utility.int2SM(dummyData.int2SMInputSmall);
    it('should return hex value ', function() {
      expect(res).to.be.a('string');
      expect(res).to.equal('02');
    });
  });
  describe('int2SM big input', function() {
    const res = utility.int2SM(dummyData.int2SMInputBig);
    it('should return hex value ', function() {
      expect(res).to.be.a('string');
      expect(res).to.equal('14');
    });
  });
  describe('convertToLESM small input', function() {
    const res = utility.convertToLESM(dummyData.convertToLESMInputSmall);
    it('should return OP CODE value ', function() {
      expect(res).to.be.a('string');
      expect(res).to.equal('OP_1');
    });
  });
  describe('convertToLESM big input', function() {
    const res = utility.convertToLESM(dummyData.convertToLESMInputBig);
    it('should return hex value ', function() {
      expect(res).to.be.a('string');
      expect(res).to.equal('ea00');
    });
  });

  describe('addressToPKH address object input', function() {
    const res = utility.addressToPKH(dummyData.address);
    it('should return public key hash value ', function() {
      expect(res).to.be.a('string');
      expect(res).to.equal('29f32a94ae80d1f1178f283408c66320e1e366c3');
    });
  });
  describe('addressToPKH address string input', function() {
    const res = utility.addressToPKH(dummyData.addressString);
    it('should return public kee hash value value ', function() {
      expect(res).to.be.a('string');
      expect(res).to.equal('29f32a94ae80d1f1178f283408c66320e1e366c3');
    });
  });

  describe('getPublicKeyStringFromPrivateKey private key object input', function() {
    const res = utility.getPublicKeyStringFromPrivateKey(dummyData.privateKey);
    it('should return public key string value ', function() {
      expect(res).to.be.a('string');
      expect(res).to.equal('023c5bf04b239d71ff42cc1a862cddd8329130363097326589d7fe9801eff6cc6a');
    });
  });
  describe('getPublicKeyStringFromPrivateKey private key string input', function() {
    const res = utility.getPublicKeyStringFromPrivateKey(dummyData.privateKeyString);
    it('should return publi key string value ', function() {
      expect(res).to.be.a('string');
      expect(res).to.equal('023c5bf04b239d71ff42cc1a862cddd8329130363097326589d7fe9801eff6cc6a');
    });
  });

  describe('getPKHfromPublicKey public key object input', function() {
    const res = utility.getPKHfromPublicKey(dummyData.publicKey);
    it('should return public key hash hex value ', function() {
      expect(res).to.be.a('string');
      expect(res).to.equal('29f32a94ae80d1f1178f283408c66320e1e366c3');
    });
  });
  describe('getPKHfromPublicKey public key string input', function() {
    const res = utility.getPKHfromPublicKey(dummyData.publicKeyString);
    it('should return public key hash hex value ', function() {
      expect(res).to.be.a('string');
      expect(res).to.equal('29f32a94ae80d1f1178f283408c66320e1e366c3');
    });
  });

  describe('buildP2pkhOutputScript public key object input', function() {
    const res = utility.buildP2pkhOutputScript(dummyData.pkh);
    it('should return pay to public key hash output script value ', function() {
      expect(res).to.be.a('object');
      const isp2pkh = bsv.Script(res).isPublicKeyHashOut();
      expect(isp2pkh).to.be.true;
    });
  });

  describe('buildP2pkhOutputScriptHex pkh input', function() {
    const res = utility.buildP2pkhOutputScriptHex(dummyData.pkh);
    it('should return hex pay to public key hash output script value ', function() {
      expect(res).to.be.a('string');
      expect(res).to.equal('76a91429f32a94ae80d1f1178f283408c66320e1e366c388ac');
    });
  });


  describe('asciiToHex string input', function() {
    const res = utility.asciiToHex(dummyData.randomString);
    it('should return hex value ', function() {
      expect(res).to.be.a('string');
      expect(res).to.equal(dummyData.randomHex);
    });
  });


  describe('hexToAscii string input', function() {
    const res = utility.hexToAscii(dummyData.randomHex);
    it('should return plain text string value ', function() {
      expect(res).to.be.a('string');
      expect(res).to.equal(dummyData.randomString);
    });
  });

  describe('convertToReverseEndian string input', function() {
    const res = utility.convertToReverseEndian(dummyData.txid);
    it('should return hex value value ', function() {
      expect(res).to.be.a('string');
      expect(res).to.equal('3412907856341290785634129078563412907856341290785634129078563412');
    });
  });

  describe('replaceSubstring string input', function() {
    it('replaces all occurrences of a substring with another string', () => {
      const str = 'Hello, world!';
      const searchValue = 'o';
      const replaceValue = 'a';
      const expected = 'Hella, warld!';
      const result = utility.replaceSubstring(str, searchValue, replaceValue);
      expect(result).to.equal(expected);
    });
  });

  describe('isP2pkhScript string input', function() {
    const res = utility.isP2pkhScript(dummyData.p2pkhOut);
    it('should return true value', function() {
      expect(res).to.be.a('boolean');
      expect(res).to.equal(true);
    });
  });

  describe('getAddressFromP2pkhOut string input', function() {
    const res = utility.getAddressFromP2pkhOut(dummyData.p2pkhOut);
    it('should return string value', function() {
      expect(res).to.be.a('string');
      expect(res).to.equal(dummyData.addressString);
    });
  });


  describe('getPkhFromP2pkhOut string input', function() {
    const res = utility.getPkhFromP2pkhOut(dummyData.p2pkhOut);
    it('should return string value', function() {
      expect(res).to.be.a('string');
      expect(res).to.equal(dummyData.pkh);
    });
  });

  describe('checkIfZeroFee object input', function() {
    const res = utility.checkIfZeroFee(dummyData.utxo);
    it('should return false value', function() {
      expect(res).to.be.a('boolean');
      expect(res).to.equal(false);
    });
  });

  describe('checkIfZeroFee undefined input', function() {
    const res = utility.checkIfZeroFee(dummyData.undefined);
    it('should return true value', function() {
      expect(res).to.be.a('boolean');
      expect(res).to.equal(true);
    });
  });

  describe('getUtxoFromTx string input', function() {
    const res = utility.getUtxoFromTx(dummyData.txHex, 0);
    it('should return object value', function() {
      expect(res).to.be.a('object');
      expect(res).to.have.property('txid');
      expect(res).to.have.property('vout');
      expect(res).to.have.property('script');
      expect(res).to.have.property('satoshis');
    });
  });
});
