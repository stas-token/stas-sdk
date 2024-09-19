const utility = require("./utility");
const stasTransfer = require("./stasTransfer");
const stasMerge = require("./stasMerge");
const { validateUtxo } = require("./errors");
const stasFeeEstimates = require("./stasFeeEstimates");
const bsv = require("bsv");

/**
 * BulkMerge class for handling bulk merging of STAS tokens.
 */
class BulkMerge {
  /**
   * Creates an instance of BulkMerge.
   * @param {Object[]} utxos - An array of UTXO objects representing the STAS tokens to be merged.
   * @param {Object} feeUtxo - A UTXO object to be used for paying transaction fees.
   * @param {string} feePrivateKey - The private key associated with the fee UTXO.
   */
  constructor(utxos, feeUtxo, feePrivateKey, isZeroFee = false) {
    this.utxos = utxos;
    this.feeUtxo = feeUtxo;
    this.feePrivateKey = feePrivateKey;
    this.feeAddress = feePrivateKey ? utility.privKeyToAddressStr(feePrivateKey) :  null
    this.feeScript = this.feeAddress ? utility.addressToP2pkh(this.feeAddress) : null
    this.isZeroFee = isZeroFee

    this.currentUtxos = [];
    this.stasScript = this.utxos[0].script;
    this.stasPrivateKey = this.utxos[0].privateKey;
    this.stasAddress = utility.privKeyToAddressStr(this.stasPrivateKey);
    this.pattern = [];
    this.patternTotals = {};
    this.transferFeeUtxos = [];
    this.merge1FeeUtxos = [];
    this.merge2FeeUtxos = [];
    this.changeUtxo = {};

    this.transactions = [];
    this.transferFeeEstimate = 0;
    this.mergeLayer1FeeEstimate = 0;
    this.mergeLayer2FeeEstimate = 0;
  }

  /**
   * Validates the input UTXOs and fee information.
   * @throws {Error} If any UTXO is invalid or missing a private key, or if the fee private key is missing.
   */
  validate() {
    this.utxos.forEach((utxo) => {
      validateUtxo(utxo);
      if (!utxo.privateKey) {
        throw new Error(
          `Bulk Merge : Each Utxo must contain a private key value!`
        );
      }
    });
    if(!this.isZeroFee){
      validateUtxo(this.feeUtxo);
      if (!this.feePrivateKey) {
        throw new Error(`Bulk Merge : Must have a fee private key value!`);
      }
    } 
  }

  /**
   * Initializes the bulk merge process.
   * @async
   * @returns {Promise<Object>} An object containing the change UTXO, all transactions, and the final STAS UTXO.
   */
  async init() {
    this.validate();
    this.stasScript = this.utxos[0].script;
    await this.feeEstimation();
    const { pattern, totals } = this.mergeFormula(this.utxos.length);
    this.patternTotals = totals;
    this.pattern = pattern;
    if(!this.isZeroFee){
      this.validateFee(totals);
      await this.feeTransaction();
    }
   
    this.currentUtxos = this.utxos.slice();
    await this.mergeSequence();
    return this.response();
  }

  /**
   * Estimates fees for different types of transactions (transfer, merge layer 1, merge layer 2).
   * @async
   * @private
   */
  async feeEstimation() {
    const testFeeUtxo = stasFeeEstimates.paymentUtxoTemplate;
    const testPrivateKey = stasFeeEstimates.templatePrivateKey;
    const address = stasFeeEstimates.templateAddress;
    const transferTx = await stasTransfer.signed(
      testPrivateKey,
      this.utxos[0],
      address,
      testFeeUtxo,
      testPrivateKey,
      undefined,
      true
    );
    this.transferFeeEstimate = bsv
      .Transaction(transferTx)
      .feePerKb(utility.SATS)
      ._estimateFee();
    const mergeTx = await stasMerge.signed(
      testPrivateKey,
      { txHex: transferTx.toString(), vout: 0 },
      testPrivateKey,
      { txHex: transferTx.toString(), vout: 0 },
      address,
      testPrivateKey,
      testFeeUtxo,
      undefined,
      true
    );
    this.mergeLayer1FeeEstimate = mergeTx.feePerKb(utility.SATS)._estimateFee();
    this.mergeLayer2FeeEstimate = await stasMerge.feeEstimate(
      { txHex: mergeTx.toString(), vout: 0 },
      { txHex: mergeTx.toString(), vout: 0 },
      undefined,
      true
    );
  }

  /**
   * Generates a merge pattern and calculates totals for different merge stages.
   * @param {number} n - The number of UTXOs to merge.
   * @returns {Object} An object containing the merge pattern and totals.
   * @private
   */
  mergeFormula(n) {
    const pattern = [{ value: n, type: "transfer" }];
    const totals = {
      transfer: n,
      merge1: 0,
      merge2: 0,
      all: 0,
      totalSatoshis: 0,
    };
    let step = "merge1";

    const patternGenerator = (num) => {
      if (num <= 1) {
        return;
      }
      let nextNum, mergeNum;
      switch (step) {
        case "transfer":
          pattern.push({ value: num, type: "transfer" });
          totals.transfer += num;
          totals.totalSatoshis += num * this.transferFeeEstimate;
          nextNum = num;
          step = "merge1";
          break;
        case "merge1":
          mergeNum = Math.floor(num / 2);
          nextNum = num - mergeNum;
          pattern.push({ value: mergeNum, type: "merge1" });
          totals.merge1 += mergeNum;
          totals.totalSatoshis += num * this.mergeLayer1FeeEstimate;
          step = "merge2";
          break;
        case "merge2":
          mergeNum = Math.floor(num / 2);
          nextNum = num - mergeNum;
          pattern.push({ value: mergeNum, type: "merge2" });
          totals.merge2 += mergeNum;
          totals.totalSatoshis += num * this.mergeLayer2FeeEstimate;
          step = "transfer";
          break;
      }
      patternGenerator(nextNum);
    };
    patternGenerator(n);
    totals.all += totals.transfer + totals.merge1 + totals.merge2;
    return { pattern, totals };
  }

  /**
   * Executes the merge sequence based on the generated pattern.
   * @async
   * @private
   */
  async mergeSequence() {
    for (let i = 0; i < this.pattern.length; i++) {
      const curLevel = this.pattern[i];
      if (curLevel.type === "transfer") {
        const isFirstLayer = i === 0 ? true : false;
        await this.buildTransferTransactions(isFirstLayer);
      } else if (curLevel.type === "merge1") {
        await this.buildMergeLayer1Transactions();
      } else {
        await this.buildMergeLayer2Transactions();
      }
    }
    const finalTransaction = this.transactions[this.transactions.length - 1];
    this.finalStasUtxo = utility.getUtxoFromTx(finalTransaction, 0);
    this.finalStasUtxo.tx = finalTransaction;
    this.finalStasUtxo.address = this.stasAddress;
  }

  /**
   * Builds transfer transactions for the current set of UTXOs.
   * @async
   * @param {boolean} isFirstLayer - Indicates if this is the first layer of transfers.
   * @private
   */
  async buildTransferTransactions(isFirstLayer) {
    const newUtxos = [];
    for (let i = 0; i < this.currentUtxos.length; i++) {
      const curUtxo = this.currentUtxos[i];
      const privateKey = isFirstLayer
        ? curUtxo.privateKey
        : this.stasPrivateKey;
      const feeUtxo = this.transferFeeUtxos.pop() || null
      const transferTx = await stasTransfer.signed(
        privateKey,
        curUtxo,
        this.stasAddress,
        feeUtxo,
        this.feePrivateKey,
        undefined,
        true
      );
      this.transactions.push(transferTx);
      newUtxos.push({ txHex: transferTx.toString(), vout: 0 });
    }
    this.currentUtxos = newUtxos;
  }

  /**
   * Builds merge transactions for the first layer of merging.
   * @async
   * @private
   */
  async buildMergeLayer1Transactions() {
    const newUtxos = [];
    if (this.currentUtxos.length % 2) {
      newUtxos.push(this.currentUtxos.pop());
    }
    for (let i = 0; i < this.currentUtxos.length; i += 2) {
      const stasUtxo1 = this.currentUtxos[i];
      const stasUtxo2 = this.currentUtxos[i + 1];
      const feeUtxo = this.merge1FeeUtxos.pop() || null
      const mergeTx = await stasMerge.signed(
        this.stasPrivateKey,
        stasUtxo1,
        this.stasPrivateKey,
        stasUtxo2,
        this.stasAddress,
        this.feePrivateKey,
        feeUtxo,
        undefined,
        true
      );
      this.transactions.push(mergeTx);
      newUtxos.push({ txHex: mergeTx.toString(), vout: 0 });
    }
    this.currentUtxos = newUtxos;
  }

  /**
   * Builds merge transactions for the second layer of merging.
   * @async
   * @private
   */
  async buildMergeLayer2Transactions() {
    const newUtxos = [];
    if (this.currentUtxos.length % 2) {
      const utxo = this.currentUtxos.pop();
      newUtxos.push(utility.getUtxoFromTx(utxo.txHex, utxo.vout));
    }
    for (let i = 0; i < this.currentUtxos.length; i += 2) {
      const stasUtxo1 = this.currentUtxos[i];
      const stasUtxo2 = this.currentUtxos[i + 1];
      const feeUtxo = this.merge2FeeUtxos.pop() || null
      const mergeTx = await stasMerge.signed(
        this.stasPrivateKey,
        stasUtxo1,
        this.stasPrivateKey,
        stasUtxo2,
        this.stasAddress,
        this.feePrivateKey,
        feeUtxo,
        undefined,
        true
      );
      this.transactions.push(mergeTx);
      newUtxos.push(utility.getUtxoFromTx(mergeTx.toString(), 0));
    }
    this.currentUtxos = newUtxos;
  }

  /**
   * Validates if the provided fee UTXO has enough satoshis for all transactions.
   * @param {Object} totals - The totals object from the merge formula.
   * @throws {Error} If there are not enough fees for the bulk merge.
   * @private
   */
  validateFee(totals) {
    const outputSize = utility.P2PKH_LOCKING_SCRIPT_BYTES * (totals.all + 1);
    const inputSize = utility.P2PKH_UNLOCKING_SCRIPT_BYTES * 1;
    const flagsSize = utility.FLAGS_BYTES * 1;
    const totalFeeTransactionSize =
      Math.ceil(
        ((outputSize + inputSize + flagsSize) * utility.SATS) / utility.PERBYTE
      ) + totals.totalSatoshis;
    if (totalFeeTransactionSize > this.feeUtxo.satoshis) {
      throw new Error(
        `Not enough fees for bulk merge! ${this.feeUtxo.satoshis} provided , ${totalFeeTransactionSize} required!`
      );
    }
  }

  /**
   * Creates a transaction to distribute fees for all merge operations.
   * @async
   * @private
   */
  async feeTransaction() {
    let globalCount = 0;
    const tx = new bsv.Transaction();

    const createUtxo = (feeEstimate, vout) => ({
      script: this.feeScript,
      vout: vout,
      satoshis: feeEstimate,
    });

    for (let i = 0; i < this.patternTotals.transfer; i++) {
      tx.to(this.feeAddress, this.transferFeeEstimate);
      this.transferFeeUtxos.push(
        createUtxo(this.transferFeeEstimate, globalCount)
      );
      globalCount++;
    }

    for (let i = 0; i < this.patternTotals.merge1; i++) {
      tx.to(this.feeAddress, this.mergeLayer1FeeEstimate);
      this.merge1FeeUtxos.push(
        createUtxo(this.mergeLayer1FeeEstimate, globalCount)
      );
      globalCount++;
    }

    for (let i = 0; i < this.patternTotals.merge2; i++) {
      tx.to(this.feeAddress, this.mergeLayer2FeeEstimate);
      this.merge2FeeUtxos.push(
        createUtxo(this.mergeLayer2FeeEstimate, globalCount)
      );
      globalCount++;
    }

    tx.from(this.feeUtxo);
    tx.change(this.feeAddress);
    tx.sign(this.feePrivateKey);
    const txHash = tx.hash;
    ["transfer", "merge1", "merge2"].forEach((type) => {
      this[`${type}FeeUtxos`].forEach((utxo) => {
        utxo.txid = txHash;
      });
    });
    if (tx.outputs.length > this.patternTotals.all) {
      this.changeUtxo = utility.getUtxoFromTx(
        tx.toString(),
        tx.outputs.length - 1
      );
      this.changeUtxo.address = this.feeAddress;
      this.changeUtxo.txHex = tx.toString();
    } else {
      this.changeUtxo = null;
    }

    this.transactions.push(tx);
  }

  /**
   * Generates the final response object after the merge process is complete.
   * @returns {Object} An object containing the change UTXO, all transactions, and the final STAS UTXO.
   * @private
   */
  response() {
    return {
      changeUtxo: this.changeUtxo,
      transactions: this.transactions,
      finalStasUtxo: this.finalStasUtxo,
    };
  }
}

module.exports = BulkMerge;