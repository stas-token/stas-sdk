const { expect } = require("chai");
const stasUtils = require("../lib/stasTemplates");
const dummyData = require("./dummyData");

describe("stasTemplates.js file Testing", async function () {
  describe("updateStasScript with new owner", function () {
    const res = stasUtils.updateStasScript(
      dummyData.pkh,
      dummyData.stas20ScriptHex
    );
    it("should update a STAS script hex with new owner ", function () {
      expect(res).to.be.a("string");
      expect(res).to.equal(dummyData.updatedStas20ScriptHex);
    });
  });

  describe("formatDataToAsmWithOpCodeConversion convert plain text string into hexadecimal ASM string", function () {
    const res = stasUtils.formatDataToAsmWithOpCodeConversion(
      dummyData.dataStringArrayWithOpCodes
    );
    it("should convert plain text string array with Op codes into hexadecimal ASM string with Op code conversion", function () {
      expect(res).to.be.a("string");
      expect(res).to.equal(dummyData.dataHexAsmWithOpCodes);
    });
  });

  describe("formatDataToHexStringWithOpCodeConversion convert plain text string into hexadecimal ASM string", function () {
    const res = stasUtils.formatDataToHexStringWithOpCodeConversion(
      dummyData.dataStringArrayWithOpCodes
    );
    it("should convert plain text string array with Op codes into hexadecimal ASM string with Op code conversion", function () {
      expect(res).to.be.a("string");
      expect(res).to.equal(dummyData.dataHexStringWithOpCodes);
    });
  });

  describe("formatDataToAsm convert plain text string into hexadecimal ASM string", function () {
    const res = stasUtils.formatDataToAsm(dummyData.dataStringArray);
    it("should convert plain text string array into hexadecimal ASM string", function () {
      expect(res).to.be.a("string");
      expect(res).to.equal(dummyData.dataHexAsm);
    });
  });

  describe("formatDataToHex convert plain text string array into hexadecimal string", function () {
    const res = stasUtils.formatDataToHex(dummyData.dataStringArray);
    it("should convert plain text string array into hexadecimal string", function () {
      expect(res).to.be.a("string");
      expect(res).to.equal(dummyData.dataHexString);
    });
  });

  describe("appendTokenData add more data to STAS hex script", function () {
    const res = stasUtils.appendTokenData(
      dummyData.stas20ScriptHex,
      dummyData.dataHexString
    );
    it("should return STAS script hex with added hex string data", function () {
      expect(res).to.be.a("string");
      expect(res).to.equal(dummyData.stasAppendScriptHex);
    });
  });

  describe("checkIfStas789 Will determine if STAS hex script is of type STAS-789", function () {
    const res = stasUtils.checkIfStas789(dummyData.stas789ScriptHex);
    it("should return true STAS-789", function () {
      expect(res).to.be.a("boolean");
      expect(res).to.equal(true);
    });
    const res2 = stasUtils.checkIfStas789(dummyData.stas20ScriptHex);
    it("should return false STAS-789", function () {
      expect(res2).to.be.a("boolean");
      expect(res2).to.equal(false);
    });
    const res3 = stasUtils.checkIfStas789(dummyData.stas50ScriptHex);
    it("should return false STAS-789", function () {
      expect(res3).to.be.a("boolean");
      expect(res3).to.equal(false);
    });
    const res4 = stasUtils.checkIfStas789(dummyData.stasScriptHex);
    it("should return false STAS-789", function () {
      expect(res4).to.be.a("boolean");
      expect(res4).to.equal(false);
    });
  });

  describe("checkIfStas20 Will determine if STAS hex script is of type STAS-20", function () {
    const res = stasUtils.checkIfStas20(dummyData.stas20ScriptHex);
    it("should return true STAS-20", function () {
      expect(res).to.be.a("boolean");
      expect(res).to.equal(true);
    });
    const res2 = stasUtils.checkIfStas20(dummyData.stas789ScriptHex);
    it("should return false STAS-20", function () {
      expect(res2).to.be.a("boolean");
      expect(res2).to.equal(false);
    });
    const res3 = stasUtils.checkIfStas20(dummyData.stas50ScriptHex);
    it("should return false STAS-20", function () {
      expect(res3).to.be.a("boolean");
      expect(res3).to.equal(false);
    });
    const res4 = stasUtils.checkIfStas20(dummyData.stasScriptHex);
    it("should return false STAS-20", function () {
      expect(res4).to.be.a("boolean");
      expect(res4).to.equal(false);
    });
  });

  describe("checkIfStas50 Will determine if STAS hex script is of type STAS-50", function () {
    const res = stasUtils.checkIfStas50(dummyData.stas50ScriptHex);
    it("should return true STAS-50", function () {
      expect(res).to.be.a("boolean");
      expect(res).to.equal(true);
    });
    const res2 = stasUtils.checkIfStas50(dummyData.stasScriptHex);
    it("should return false STAS-50", function () {
      expect(res2).to.be.a("boolean");
      expect(res2).to.equal(false);
    });
    const res3 = stasUtils.checkIfStas50(dummyData.stas20ScriptHex);
    it("should return false STAS-50", function () {
      expect(res3).to.be.a("boolean");
      expect(res3).to.equal(false);
    });
    const res4 = stasUtils.checkIfStas50(dummyData.stas789ScriptHex);
    it("should return false STAS-50", function () {
      expect(res4).to.be.a("boolean");
      expect(res4).to.equal(false);
    });
  });

  describe("checkIfStasLegacy Will determine if STAS hex script is of type STAS legacy", function () {
    const res = stasUtils.checkIfStasLegacy(dummyData.stasScriptHex);
    it("should return true STAS legacy", function () {
      expect(res).to.be.a("boolean");
      expect(res).to.equal(true);
    });
    const res2 = stasUtils.checkIfStasLegacy(dummyData.stas50ScriptHex);
    it("should return false STAS legacy", function () {
      expect(res2).to.be.a("boolean");
      expect(res2).to.equal(false);
    });
    const res3 = stasUtils.checkIfStasLegacy(dummyData.stas20ScriptHex);
    it("should return false STAS legacy", function () {
      expect(res3).to.be.a("boolean");
      expect(res3).to.equal(false);
    });
    const res4 = stasUtils.checkIfStasLegacy(dummyData.stas789ScriptHex);
    it("should return false STAS legacy", function () {
      expect(res4).to.be.a("boolean");
      expect(res4).to.equal(false);
    });
  });

  describe("parseTokenData get token data from STAS-20 script hex", async function () {
    const res = await stasUtils.parseTokenData(dummyData.stas20ScriptHex);
    it("should return STAS-20 script meta data after token symbol", function () {
      expect(res).to.be.a("array");
      expect(res[0]).to.equal(dummyData.stas20MetaDataArray[0]);
    });
  });

  describe("parseTokenData get token data from STAS script hex", async function () {
    const res = await stasUtils.parseTokenData(dummyData.stasScriptHex);
    it("should return STAS script meta data after token symbol", function () {
      expect(res).to.be.a("array");
      expect(res[0]).to.equal(dummyData.stasMetaDataArray[0]);
    });
  });

  describe("parseTokenData get token data from STAS-789 script hex", async function () {
    const res = await stasUtils.parseTokenData(dummyData.stasAppendScriptHex);
    it("should return STAS-789 script meta data after token symbol", function () {
      expect(res).to.be.a("array");
      expect(res[0]).to.equal(dummyData.stas789MetaDataArray[0]);
      expect(res[1]).to.equal(dummyData.stas789MetaDataArray[1]);
      expect(res[2]).to.equal(dummyData.stas789MetaDataArray[2]);
      expect(res[3]).to.equal(dummyData.stas789MetaDataArray[3]);
    });
  });

  describe("getScriptFlags get STAS flags string", function () {
    const res = stasUtils.getScriptFlags(dummyData.stasScriptHex);
    it('should return STAS flags string "01" or "00"', function () {
      expect(res).to.be.a("string");
      expect(res).to.equal("01");
    });
  });

  describe("getRedeemPublicKeyHash get STAS redeem public key hash string", function () {
    const res = stasUtils.getRedeemPublicKeyHash(dummyData.stasScriptHex);
    it("should return STAS redeem public key hash string", function () {
      expect(res).to.be.a("string");
      expect(res).to.equal("a612c7d3aa1dcb36af32d96c384ced6eb09d3f25");
    });
  });

  describe("getSymbol get STAS symbol string", function () {
    const res = stasUtils.getSymbol(dummyData.stasScriptHex);
    it("should return STAS symbol string", function () {
      expect(res).to.be.a("string");
      expect(res).to.equal("SOMESTASTOKEN");
    });
  });

  describe("getSymbol get STAS-20 symbol string", function () {
    const res = stasUtils.getSymbol(dummyData.stas20ScriptHex);
    it("should return STAS-20 symbol string", function () {
      expect(res).to.be.a("string");
      expect(res).to.equal("SOMESTAS20TOKEN");
    });
  });

  describe("isSplittable get STAS script splittable value", function () {
    const res = stasUtils.isSplittable(dummyData.stasScriptHex);
    it("should return true for STAS script", function () {
      expect(res).to.be.a("boolean");
      expect(res).to.equal(false);
    });
  });

  describe("isSplittable get STAS-20 script splittable value", function () {
    const res = stasUtils.isSplittable(dummyData.stas20ScriptHex);
    it("should return true for STAS-20 script", function () {
      expect(res).to.be.a("boolean");
      expect(res).to.equal(true);
    });
  });

  describe("isStasScript check STAS legacy is type STAS token", function () {
    const res = stasUtils.isStasScript(dummyData.stasScriptHex);
    it("should return true for STAS legacy script", function () {
      expect(res).to.be.a("boolean");
      expect(res).to.equal(true);
    });
  });

  describe("isStasScript check STAS-20 is type STAS token", function () {
    const res = stasUtils.isStasScript(dummyData.stas20ScriptHex);
    it("should return true for STAS-20 script", function () {
      expect(res).to.be.a("boolean");
      expect(res).to.equal(true);
    });
  });

  describe("isStasScript check STAS-50 is type STAS token", function () {
    const res = stasUtils.isStasScript(dummyData.stas50ScriptHex);
    it("should return true for STAS-50 script", function () {
      expect(res).to.be.a("boolean");
      expect(res).to.equal(true);
    });
  });

  describe("isStasScript check STAS-789 legacy is type STAS token", function () {
    const res = stasUtils.isStasScript(dummyData.stas789ScriptHex);
    it("should return true for STAS-789 legacy script", function () {
      expect(res).to.be.a("boolean");
      expect(res).to.equal(true);
    });
  });

  describe("isStasScript check STAS-789 legacy is type STAS token", function () {
    const res = stasUtils.isStasScript(dummyData.stas789ScriptHex);
    it("should return true for STAS-789 legacy script", function () {
      expect(res).to.be.a("boolean");
      expect(res).to.equal(true);
    });
  });

  describe("getSymbolFromContract get STAS token symbol from contract hex script", function () {
    const res = stasUtils.getSymbolFromContract(dummyData.contractHexScript);
    it("should return STAS token symbol from contract hex script", function () {
      expect(res).to.be.a("string");
      expect(res).to.equal("SOMESTASTOKEN");
    });
  });
});
