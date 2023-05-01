const bsv = require('bsv');
const axios = require('axios');
/**
 * TestTools class will provide functions to utilize private key that contain funds to build UTXOs required to mint a STAS token. We will use Whats On Chain API services to retrieve UTXOs and broadcast transactions.
 * To get the private key you can type in the terminal : node getPrivateKeys.js while in the /tests directory
 * This will log a random private key that you can use as well as an address where you can send BSV to use for testing.
 * If wanting to remove funds from the testing address please go to getFundsFromAddress.js file and follow the instructions
 */
class TestTools {
	constructor() {
        this.privateKey = bsv.PrivateKey.fromString('Enter Private Key for Funds here');
        this.address = bsv.Address.fromPrivateKey(this.privateKey).toString();
		this.p2pkhOut = bsv.Script.buildPublicKeyHashOut(this.address).toHex();
		this.pkh = bsv.Address.fromString(this.address).toJSON().hash;

        this.issuerPrivateKey = bsv.PrivateKey.fromString('Enter issuer Private Key here');
        this.issuerAddress = bsv.Address.fromPrivateKey(this.privateKey).toString();
		this.issuerP2pkhOut = bsv.Script.buildPublicKeyHashOut(this.address).toHex();
		this.issuerPkh = bsv.Address.fromString(this.address).toJSON().hash;

        this.utxos = []
        this.issuerUtxo 
        this.contractFeeUtxo
        this.issueFeeUtxo
        this.redeemFeeUtxo
    }

    async getAddressUnspentUtxos(address) {
		const res = await axios({
			method: 'get',
			url: `https://api.whatsonchain.com/v1/bsv/main/address/${address}/unspent`
		});
		return res.data;
	}

    async getBalance(utxos) {
		let balance = 0;
		utxos.map(({ satoshis }) => {
			balance += satoshis;
		});
		console.log(`Address : ${this.address}, Balance : ${balance}`);
		return balance;
	}

	async getAddressUtxos() {
		const utxos = await this.getAddressUnspentUtxos(this.address);
		const formatedUtxos = [];
		for (const utxo of utxos) {
			const formatedUtxo = {
				txid: utxo.tx_hash,
				vout: utxo.tx_pos,
				satoshis: utxo.value,
				script: this.p2pkhOut
			};
			formatedUtxos.push(formatedUtxo);
		}
		this.utxos = formatedUtxos;
	}

    getUtxoFromTx(tx, index){
        const txObj = bsv.Transaction(tx).toObject()
        return {
            txid : txObj.hash,
            vout : index,
            script : txObj.outputs[index].script,
            satoshis  : txObj.outputs[index].satoshis
        }
    }

    async prepareUtxosForMint(tokenSatoshis) {
        const tx = bsv.Transaction()
        tx.feePerKb(50)// current fee rate accepted by Whats On Chain
        
        tx.from(this.utxos)
        // UTXO for tokens 
        tx.addOutput(new bsv.Transaction.Output({
            script: this.issuerP2pkhOut,
            satoshis: tokenSatoshis
        }))
        // UTXO for contract transaction fee
        tx.addOutput(new bsv.Transaction.Output({
            script: this.p2pkhOut,
            satoshis: 1000
        }))
        // UTXO for issuance transaction fee
        tx.addOutput(new bsv.Transaction.Output({
            script: this.p2pkhOut,
            satoshis: 1000
        }))
        // UTXO for redeem transaction fee
        tx.addOutput(new bsv.Transaction.Output({
            script: this.p2pkhOut,
            satoshis: 1000
        }))
        tx.change(this.address)
        tx.sign(this.privateKey)

        const response = await this.broadcast(tx.toString())
        console.log('Prepare Utxos Txid: ', response.data)
        this.issuerUtxo = this.getUtxoFromTx(tx, 0)
        this.contractFeeUtxo = this.getUtxoFromTx(tx, 1)
        this.issueFeeUtxo = this.getUtxoFromTx(tx, 2)
        this.redeemFeeUtxo = this.getUtxoFromTx(tx, 3)
    
    }

    async sendRemainingFundsToAddress (address) {
        const tx = bsv.Transaction()
        tx.feePerKb(50)// current fee rate accepted by Whats On Chain

        tx.from(this.utxos)
        tx.to(address, 11)// send minimal output plus all change to the address arguemnt
        tx.change(address)
        tx.sign(this.privateKey)
        const response = await this.broadcast(tx.toString())
        console.log('Send Utxos Txid: ', response.data)
    }

    async broadcast(rawTX) {
        const res = await axios.post(
            'https://api.whatsonchain.com/v1/bsv/main/tx/raw',
            {
                txhex: rawTX
            },
            {
                headers: {
                    'content-type': 'application/json',
                }
            }
        );
        return res;
    }
}

module.exports = new TestTools()
