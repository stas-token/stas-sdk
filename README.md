# STAS-SDK Library

## Overview
STAS Tokens are UTXO based smart contracts that have a variety of templates that can be used to create transactions for all types of specific use cases. STAS tokens are considered layer zero tokens as they are bound to the native satoshi value of the BSV blockchain.
This library offers an effortless and user-friendly experience for interaction with UTXO blockchain that utilizes STAS tokens. STAS tokens are a growing list of UTXO-based smart contracts that can be employed for various transactions. The library is designed to provide functional neutrality for interaction with any STAS token type. Some examples include NFTs, Fungible tokens, Appendable tokens and more.


## Features
- Contract - 
This feature allows users to build a contract schema transaction that defines the details of a STAS token before it is minted. This provides the foundation for creating custom STAS tokens to suit specific needs.

- Issuance -
The token issuance feature allows users to spend the contract UTXO to issue the tokens that have been predefined by the contract. This enables the creation and distribution of STAS tokens that can utilize differnt template types.

- Transfer -
The token transfer feature is used to build transactions for transferring STAS tokens from one address to another. This provides a convenient way to send and receive STAS tokens.

- Split -
The token split feature allows users to build transactions that send STAS tokens to multiple addresses at once. This provides a convenient way to distribute tokens among multiple recipients.

- Merge -
The token merge feature enables users to merge up to two STAS UTXOs in a single transaction. This can be useful for optimizing the size of your wallet and reducing the number of UTXOs you hold.

- Merge and Split -
The merge and split feature allows users to build transactions that merge two UTXOs as inputs and then split them into multiple outputs. This provides a convenient way to optimize your UTXOs and make the most efficient use of your token balance.

- Redeem -
The token redeem feature allows users to redeem or destroy STAS tokens and receive the equivalent value in native BSV. This provides a convenient way to liquidate your STAS tokens and convert them into native BSV.

- Redeem and Split - 
The token redeem and split feature allows users to redeem a portion of a STAS token in satoshis and receive the equivalent value in native BSV. This provides a convenient way to destory a portion of your STAS tokens without having to redeem the entire balance or create separate transactions.

- Atomic Swaps -
The atomic swap feature enables users to swap STAS tokens with other STAS tokens or native BSV. This provides a convenient way to trade and exchange STAS tokens for other tokens or native BSV.

- Unsigned Transactions -
The library also supports unsigned transactions, which can be used in any function where transactions need to be signed externally.
 
- Zero-Fee Transactions -
The library provides the ability to create zero-fee transactions, which contain no fee UTXO input or output.

- Zero-Change Output Transactions -
The library also provides the ability to create transactions with zero-change outputs, which do not contain a fee UTXO change amount. Furthermore, we have incorporated a "ZEROCHANGETHRESHOLD" variable into the utility.js file that enables zero-fee transactions. By specifying a numeric value for this variable, any satoshis above the specified amount will trigger an error message indicating that the excess amount exceeds the limit. This is to ensure that excess satoshis are not accidently supplied to the miners over their default fee rates.

- Fee-Estimates Functions -
The fee estimate functions are utilized to compute transaction fees using minimal input parameters. These functions are suitable for zero-change output transactions, where a pre-calculated UTXO has been provided as payment for the fees. Moreover, these functions can be employed as simple fee reference tools to verify if the supplied fee UTXO has sufficient funds to facilitate the transaction's approval by the miner.

- Multiple Template Support -
The library supports multiple STAS token templates, which are an evolving class of smart contracts with specified rule sets. These templates provide different use cases for each STAS token, providing flexibility and versatility to meet a variety of needs.

&nbsp;

## STAS Templates

The library offers a variety of templates, each of which can be customized with any relevant data that may be necessary for your specific use case. This enables you to tailor your STAS token to your precise requirements. The following are the current implementation options that are available for use within the library.

- STAS-789 - 
This innovative design offers a non-divisible version of the STAS token that enables the addition of more data after each transfer. This token prohibits the deletion of previously added data, allowing only for the appendage of new information. This feature is also optional on this STAS token and use cases that may suit this token include but no limited to data logging and supply chain management.

- STAS-20 -
A token template specifically designed for stable coins, this token possesses all the features of the original divisible token with some added unique features. Optionally an OP_RETURN output can be added to the transaction, which can support up to 65553 bytes, useful for transaction notes, etc. Additionally, redemption is only possible by the issuer.

- STAS-50 - 
This STAS template has been expanded to accommodate a greater number of outputs in a single transaction. This token can be set to splittable or non splittable type on issuance. With a larger script size, can now handle up to 50 outputs per transaction.

- STAS (legacy) - 
The original template of the library offers the option to make tokens either splittable or non-splittable during the contract and issuance stage. Non-splittable tokens are best suited for NFTs as they allow for custom data to represent unique digital assets. On the other hand, splittable tokens, commonly used for stable coins, can be merged or split into multiple UTXOs. The redemption function for both types of tokens will return native BSV to the original contract address, as it is defined in the smart contract. 

&nbsp;

## Token Properties in Detail

A comprehensive table has been prepared to display all the characteristics and attributes of each token template script. This tool will be incredibly helpful in determining the most suitable token template to use for your particular needs. By referring to the table, you will be able to compare and contrast the various token templates, and ultimately make an informed decision on which one to select. This will ensure that you choose the token template that is best suited for your project and will help you achieve your desired outcome.

&nbsp;

- Splittable - determines if a token can be split or merged with other UTXOs. If it's splittable, it can be merged with other STAS token UTXOs that have matching script values, regardless of whether their owner addresses match.

- MaxInputsPerTx - the maximum number of utxo input elements allowed per transaction, excluding the fee UTXO. This applies to transaction types such as merge, mergeSplit, or atomic swap functions where more than one STAS input is required.

- MaxOutputsPerTx - the maximum number of outputs allowed per transaction, excluding the fee UTXO. This applies to transaction types such as split, mergeSplit, redeemSplit, or acceptSwap functions.

- DataOutput - determines if the STAS template supports an additional OP_RETURN output in the transaction.

- Flags - determines if the STAS template supports both splittable and non-splittable types. When flags are permitted during issuance, the STAS token will be issued as either splittable or not.

- DataAppend - an additional data array that can be added to an existing STAS token script during a transfer transaction.

- RedeemAny - determines if the STAS token can be redeemed by any token owner address.

- SendToIssuerAddress - for some STAS token templates, sending the token to the issuer address is not allowed. This applies only to output index #0 in the transaction and is part of the redemption functionality when RedemptionAny is true, reserving that address only for redemption purposes.

- RoyaltyPayment - a conditional output in the transaction that pays a certain address upon any transaction.

&nbsp;

| STAS Template | Splittable | MaxInputsPerTx | MaxOutputsPerTx | DataOutput | Flags | DataAppend | RedeemAny | SendToIssuerAddress | RoyaltyPayment |
| -------- | -------- | -------- | -------- | -------- | -------- | -------- | -------- | -------- | ---------|
| STAS-20 | true | 2 | 4 | true | false | false | false | true | false |
| STAS-789 | false | 2 | 4 | false | false | true | true | false | false |
| STAS-50 | true or false | 2 | 50 | false | true | false | true | false | false |
| STAS (legacy) | true or false | 2 | 4 | false | true | false | true | false | false | false |

&nbsp;


## SDK Reference
The library is comprised of primary function files that are responsible for transaction creation. Each of these files contains three primary functions: sign, unsigned, and feeEstimate.
- signed - The sign function generates and returns a hexadecimal string that represents the signed transaction.
- unSigned -  the unsigned function returns an object that contains two fields. The "tx" field contains the transaction itself, while the "unsignedData" field includes an array of data for each unsigned input in the transaction. This data contains all of the necessary arguments required to sign the transaction, including the public key string that can be used to retrieve the corresponding private key. More on this in Advanced Features section.
- feeEstimate - the feeEstimate function calculates the transaction cost in satoshis, taking into account the fee rates defined in the utility.js variables SATS and PERBYTE. The result of this calculation is then returned as a numerical value.

&nbsp;
## Installation
In this example we will set up a new folder to install and test the SDK. This will require Node.js to be installed.

&nbsp;

1. Create a new project directory: Open your terminal and navigate to the directory where you want to create your project. Then run the command mkdir mintTest to create a new directory for your project.
```
mkdir mintTest
```
&nbsp;

2. Initialize a new Node.js project: Navigate into the new directory you just created using the command cd mintTest , and then run the command npm init -y. This will initialize a new Node.js project and create a package.json file that contains metadata about your project, such as its name, version, and dependencies.
```
&nbsp;

cd mintTest
npm init -y
```
&nbsp;

3. Install required packages: In your project directory we will now install the stas and bsv libraries:
```
npm install bsv@1.5.6
npm install stas-sdk
```
&nbsp;

4. Create an entry point file: In your project directory, create a new file called index.js. This will serve as the entry point for your application, where you can import the libraries and write your code.
```
ni index.js
```
&nbsp;

5. Import required libraries: In your index.js file, import the required libraries using the require function. Here's an example:
```
const bsv = require('bsv');
const stas = require('stas-sdk');

// or to get single functions directly 
const {stasTransfer} = require('stas-sdk/index');
```
&nbsp;

The imported stas library will contain all functions ready to be utilized by your application.


## Getting Started

To conduct testing, simply navigate to the tests folder. 

```
cd node_modules/stas-sdk/tests
```

Within this folder, you will find non-broadcasting examples, as well as various tools that can be utilized to test the mainnet and mint your initial tokens in a matter of minutes. All of these resources can be found within the /tests directory.

&nbsp;

### Non broadcasting
When conducting non-broadcasting tests, the functions will leverage mock UTXO data in order to construct transactions via the library's functions. This approach is ideal for those who are just beginning to learn how the library and its functions operate. Through this process, you will be able to complete a full cycle of transactions, which will cover all of the functions within the library that involve the handling of STAS UTXOs.

&nbsp;

To run a mock token mint test, while in the /test directory run this command in your terminal 
```
node nonBroadcastMint.js
```

&nbsp;

To run a mock full cycle test, while in the /test directory run this command in your terminal 
```
node nonBroadcastFullCycleTest.js
```

Both of these test scripts will log transaction hexadeciamls to the console for example purposes only.

&nbsp;


### Mint your first token

Here is a straightforward example that illustrates how you can mint your very first token. To begin, you will need to add your private key to the testUtility.js file. To obtain a new random private key simply run this command in the terminal while in the /tests directory

```
node getPrivateKey.js
```

&nbsp;

 Upon doing so, you will see a corresponding address appear in the console. 
 
 
 ```
Address to send funds to:  "some address "
Funding Private Key: "some private key"
 ```
 In order to utilize this address for minting purposes, you will need to first send funds to it. Please note that a minimum of 5000 satoshis will be required in order to run the test, although only a fraction of this amount will actually be used in the mint example. Please be sure to keep a copy of this private key if you still have funds that you would like to recover in the future. At any time you would like to withdraw the funds from the test address please refer to the /tests/getFundsFromAddress.js file and follow the instructions.

 &nbsp;


To proceed, take the private key string and replace the two values in the testUtility.js file. In this example, you can use the same private key for both variables on lines 11 and 16
```
this.privateKey = bsv.PrivateKey.fromString('Enter Funding Private Key Here');
this.issuerPrivateKey = bsv.PrivateKey.fromString('Enter Funding Private Key Here');
```
Please be sure to keep a copy of this private key if you still have funds that you would like to recover in the future. At any time you would like to withdraw the funds from the test address please refer to the /tests/getFundsFromAddress.js file and follow the instructions.

&nbsp;

Now we are ready to test!
Simply, while in the /test directory you can run this command in the terminal
```
node instantMint.js
```
&nbsp;

The process will start and the token will be minted onchain with all Txids provided. 

```
Starting Instant Mint Example...
Fetching UTXO from the blockchain...
Building transactions...
Prepare Utxos Txid:  31fa389bec5677c048e6a5539467dda02da576427f8bbccb22fcb2250cd601ec
Contract Txid:  81bbdce661ea6b0133e8073a48b8334658bf6151d08cb8061d4a106175a095fb
Issue Txid:  7b678504f67fc87e93ddd6816800d73915cd43a09ad2a53d177cc539b3f8c233
Redeem Txid:  c7951ceb0bb8fd712e2e993a022d7d37c23a65a779477e5e80694640e6d9cb45
Instant Mint Example Completed
```

&nbsp;

### Minting Tokens in Detail

To mint tokens, two transaction building functions - Contract and Issuance - are needed. The Contract transaction generates a JSON output that defines the token properties and metadata, and includes all the satoshis necessary for the token issuance transaction. The Issuance transaction spends the Contract UTXO as input and adds token scripts as outputs, effectively linking the contract metadata to the issuance transaction, resulting in the creation of the tokens.

### Contract

To generate a Contract transaction, a JSON object containing token information is necessary. You can find a template of this JSON object in tokenSchemaTemplate.js.


```
const tokenSchemaTemplate = {
    name: "Test Token",
    protocolId: "STAS-20", 
    symbol: "TESTTOKEN001", // REQUIRED
    description: "This is a test token",
    image: "Some Image URL",
    totalSupply: 10, // REQUIRED
    decimals: 0,
    satsPerToken: 1, // REQUIRED
    properties: {
      legal: {
        terms: "STAS, Inc. retains all rights to the token script. Use is subject to terms at https://stastoken.com/license.",
        licenceId: "stastoken.com"
      },
      issuer: {
        organisation: "string",
        legalForm: "string",
        governingLaw: "string",
        issuerCountry: "string",
        jurisdiction: "string",
        email: "string"
      },
      meta: {
        schemaId: "STAS1.0",
        website: "string",
        legal: {
          terms: "string"
        },
        media: [
          {
            URI: "string",
            type: "string",
            altURI: "string"
          }
        ]
      }
    },
  }

```


The contractUtxo holds the satoshis that will fund the token supply. The satoshi amount in the contractUtxo must meet a minimum requirement for the token(s) being minted, and any extra satoshis will be returned to the issuer address in the form of a change output. 
The paymentUtxo is used to cover the transaction fees for the transaction.
You can pass in the tokenSchema as a JSON object, which will be added to the transaction output.
The token satoshis refer to the total amount of satoshis utilized in the token supply.


```
const contractHex =  await stasContract.signed(
    issuerPrivateKey,
    contractUtxo,
    paymentUtxo,
    paymentPrivateKey,
    tokenSchema,
    tokenSatoshis
)
```

After executing the function, you will receive a transaction hexadecimal representation that is now ready to be broadcasted to the miner.

You need to use the contract output #0 UTXO in the issuance function. The utility.js file includes a helper function that retrieves a UTXO object from a transaction hex. This function takes the transaction hex and output index value as arguments.


```
const stas = require('stas-sdk')
const {utility} = stas

const contractUtxo = utility.getUtxoFromTx(contractHex, 0)
```

### Issuance

The issuance function is responsible for generating the transaction that issues the tokens. You can set any amount of satoshis per token during issuance. However, the library will verify that the total token supply and the satoshis per token correspond to the value in the contract UTXO. 

Tokens can be issued as single or multiple outputs, in the case of splittable tokens. However, for non-splittable tokens, each token will be issued as a separate output since they cannot be divided or combined with other scripts of the same data value.

#### IssueData

Here is an example of the issue data array.

```
const issueInfo = [
    {
		addr: "Some address string",
		satoshis: 100,
		data: ['STAS CUSTOM DATA', 'STAS CUSTOM DATA 2', 'STAS CUSTOM DATA 3']
	}
]
```

In this example, we are issuing 100 tokens to a single address and incorporating three custom data elements into the token script. The data field can accept an array consisting of string values. Each element of the array will be transformed into a hexadecimal data chunk and appended to the token script in ASM format. This method facilitates the separation of each data element with a space while in ASM format.


We can also distribute tokens to multiple addresses, as illustrated in the following example:

```
const issueInfo = [
    {
		addr: "Some address string ONE ",
		satoshis: 50,
		data: ['STAS CUSTOM DATA', 'STAS CUSTOM DATA 2', 'STAS CUSTOM DATA 3']
	},
    {
		addr: "Some address string TWO",
		satoshis: 50,
		data: ['STAS CUSTOM DATA', 'STAS CUSTOM DATA 2', 'STAS CUSTOM DATA 3']
	}
]

```

IMPORTANT : It's crucial to note that when issuing splittable tokens and intending to merge them later using the merge and mergeSplit functions, the custom data must be identical across all tokens outputs in the issueInfo array. The UTXO scripts of tokens can only be merged if their data matches precisely. If the tokens will not be combined in the future, you may issue them with varying custom data. To restrict the merging capability of tokens for future use cases, consider issuing non-splittable token types since these cannot be merged on a script level. To learn more about splittable and non-splittable tokens, as well as additional information about available token templates, please refer to the Token Properties in Detail section.


When using non-splittable tokens, it is essential to ensure that the token supply and the satoshis per token match the number of outputs in the issuance transaction. Below is an example that illustrates this:

```
const issueInfo = [
    {
		addr: "Some address string ONE ",
		satoshis: 1,
		data: ['STAS CUSTOM DATA FOR NFT1', 'STAS CUSTOM DATA 2 FOR NFT1', 'STAS CUSTOM DATA 3 FOR NFT1']
	},
    {
		addr: "Some address string TWO",
		satoshis: 1,
		data: ['STAS CUSTOM DATA FOR NFT2', 'STAS CUSTOM DATA 2 FOR NFT2', 'STAS CUSTOM DATA 3 FOR NFT2']
	},
    {
		addr: "Some address string THREE",
		satoshis: 1,
		data: ['STAS CUSTOM DATA FOR NFT3', 'STAS CUSTOM DATA 2 FOR NFT3', 'STAS CUSTOM DATA 3 FOR NFT3']
	},
    {
        ...
    },
    ...
]

```

In this example we are creating multiple tokens with unique custom data added for each output. 

The issuerPrivateKey will sign for the contractUtxo, and a paymentUtxo is added to pay the transaction fees along with the corresponding private key. The final function arguments are as follows:

isSplittable  : is a boolean value that is only necessary for token templates that have flags indicating whether the token can be splittable or non-splittable. This is applicable to protocol types such as "STAS" or "STAS-50". However, for token templates that do not have such flags, this argument is not relevant and can be ignored by passing undefined in its place.

symbol : is a string value representing the token symbol. For it to be considered valid, it must match the tokenId field specified in the contract token schema JSON.

protocol : represents the token template used to issue the token and must be a string value, such as "STAS-20" or "STAS-789".


```
const issuanceHex = await stasIssuace.signed(
    issuerPrivateKey, 
    issueData, 
    contractUtxo, 
    paymentUtxo, 
    paymentPrivateKey, 
    isSplittable, 
    symbol, 
    protocol
)
```
After executing the function, you will receive a transaction hexadecimal representation that is now ready to be broadcasted to the miner.



## Transaction examples

In the following examples, we will demonstrate how to employ the functions and the format in which the arguments are needed. UTXOs, in general, will employ a standardized format across the library. This format will consist of an object encompassing the following four fields:

```
const utxo = {
    txid : string,
    satoshis : number,
    vout : number,
    script : string, // hexadecimal representation
}
```

&nbsp;


### Transfer
To begin, let us examine the transfer function, which is used to generate a transaction hexadecimal that will allow you to send STAS tokens to another designated address. Once you have successfully completed the installation process, you will be able to access the SDK functions.

To utilize the transfer function, it is necessary to first prepare some UTXOs. Specifically, you will need a stasUtxo, which will be the STAS token utilized in the transfer, as well as a paymentUtxo, which will provide funding for the transaction fees.

Both UTXOs will require private keys to be supplied, although it is possible to use the same private keys for both, if applicable. Finally, you will need to input the destination address string to complete the process.

```
const transferHex = await stasTransfer.signed(
    ownerPrivatekey, 
    stasUtxo, 
    destinationAddress, 
    paymentUtxo, 
    paymentPrivateKey)
```
After executing the function, you will receive a transaction hexadecimal representation that is now ready to be broadcasted to the miner.

&nbsp;
### Split
Similar to the transfer function, this particular function generates a hexadecimal representation of a transaction that can distribute tokens to multiple addresses at once. It should be noted that this function is only applicable to tokens that have the splittable property set to true. For more details on which token templates possess this attribute, please refer to the STAS features table.

To create a split transaction, we need a STAS UTXO, a fee UTXO, and the private keys linked with these UTXOs. Instead of the destination address required in the transfer function, we need an array that contains all the destination addresses and their corresponding amounts.

The splitDestinations array is made up of objects that contain two fields. Please keep in mind that the sum of the outputs' amounts must match the amount in the STAS UTXO input to ensure a valid transaction is created.

```
const splitDestinations = [
    {
        satoshis : 10,
        address : "someAddressString"
    },
    {
        satoshis : 10,
        address : "someOtherAddressString"
    }
]
```

&nbsp;

It should be noted that if the token owner needs to receive change from the STAS UTXO input, it must be included in the splitDestination array. The total amount in the outputs of the array should match the input satoshis amount.

```
const splitHex = await stasSplit.signed(
    ownerPrivatekey, 
    stasUtxo, 
    splitDestinations, 
    paymentUtxo, 
    paymentPrivateKey)
```
After executing the function, you will receive a transaction hexadecimal representation that is now ready to be broadcasted to the miner.

&nbsp;

### Merge
With the merge function, it is possible to combine two STAS UTXO inputs into one output. However, please keep in mind that this function can only be used by tokens that have the splittable property set to true. For more information on which token templates have this property, please consult the STAS features table.

Merging can also only occur for STAS UTXOs that contain identical script values. 

The merge function has different parameters compared to the split or transfer functions. It necessitates the previous transaction hex value of the UTXOs being merged, and the required format is as follows:

```
const stasInput1 = {
    txHex : 'previous transaction hex string',
    vout : 'output index of the UTXO being spent'
}

const stasInput2 = {
    txHex : 'previous transaction hex string',
    vout : 'output index of the UTXO being spent'
}
```

&nbsp;


The previous transaction hex is required as part of the unlocking script to complete the merge functionality.
To create a merge transaction, the following additional parameters are necessary: private keys for both UTXO inputs, a destination address, and the payment UTXO and its corresponding private key.

```
const mergeHex = await stasMerge.signed(
    ownerPrivateKey1,
    stasInput1,
    ownerPrivateKey2,
    stasInput2,
    destinationAddr,
    paymentPrivateKey,
    paymentUtxo)

```
After executing the function, you will receive a transaction hexadecimal representation that is now ready to be broadcasted to the miner.

NOTE: It is important to keep in mind that the size of the merge transaction will increase after each subsequent merge transaction due to its design nature. To optimize the transaction size, it is recommended to consider ways to mitigate the compounding effects of the data size. One possible solution is to use interval transfer functions for each UTXO being merged, which resets the previous transaction hexadecimal to the size of a transfer transaction. It is recommended to transfer the UTXO after every two merge transactions as a means of resetting the transaction size before continuing with additional merge transactions.

The MergeSplit function works in a similar way to merge, with the exception that instead of a single destination address, it accepts an array of splitDestinations, just like in the split function.

&nbsp;

### Redeem
Token redemption refers to the process of converting the STAS token satoshis back into native BSV satoshis, which essentially destroys the STAS token. To perform this operation, a single STAS UTXO input is required, and the resulting output is in the form of a regular pay-to-public-key-hash output. By default, the unlocked satoshis are always sent to the issuer address of the token, which is known as the redemption address and can be found in the token script as the first element after the OP_RETURN.

This function will take the typical arguments as follows:

```
const redeemHex = await stasRedeem.signed(
    ownerPrivateKey,
    stasUtxo,
    paymentUtxo,
    paymentPrivateKey)

```
After executing the function, you will receive a transaction hexadecimal representation that is now ready to be broadcasted to the miner.

The RedeemSplit function is designed to operate similarly to the redeem function, with an added parameter called "splitDestinations". This parameter specifies where the additional outputs of the transaction will be directed, much like the split function. It's worth noting that the total amount designated for split destinations will determine the number of satoshis redeemed from the STAS UTXO input. For example, if the STAS UTXO input contains 10 satoshis and the total output amount in the split destination array is 8, only 2 satoshis will be redeemed. The remaining satoshis will remain locked in STAS tokens and be sent to the new destination address(es).

&nbsp;

## Atomic Swaps
The process of atomic swaps entails the utilization of partially signed components from both parties, and completion occurs only after both parties have signed all the necessary pieces. With this SDK, there are two methods available to accomplish an atomic swap transaction: a two-step and a three-step approach.

To begin with, let's examine the two-step method provided by the SDK, which involves utilizing two functions, namely "stasCreateSwap" and "stasAcceptSwap."

&nbsp;

### Two step swap
The stasCreateSwap function requires the user to input a UTXO that they are willing to swap for something else, which can either be a STAS token or native BSV. The user must also specify the output they desire to receive as a result of the atomic swap transaction, which can also be either a STAS token or native BSV output.

&nbsp;

To define the output, the SDK utilizes an object known as wantedData, which comprises the following fields:
```
const wantedData = {
    satoshis :  number
    script :  scriptHex // optional if STAS script
}
```

&nbsp;

In the event that only the value of the satoshis field is provided, stasCreateSwap will create a native BSV output to the address from input #0. However, if the user desires a specific STAS token for the atomic swap, the script field must be supplied with the hexadecimal representation of the token script.


```
const offerHex = await stasCreateSwap.signed(
    ownerPrivateKey, 
    utxo, 
    wantedData
)
```

&nbsp;

The subsequent step involves finalizing the atomic swap transaction by adding the remaining inputs and information required to generate the unlocking scripts. In the stasAcceptSwap function, the following core arguments are required, and we will examine each one in this example:

&nbsp;

offerTxHex: This represents the hexadecimal form of the transaction from the stasCreateSwap function.
ownerPrivateKey: This refers to the private key of the UTXO's owner who is participating in the atomic swap transaction.
makerInputTxHex: This denotes the complete transaction hexadecimal of the input #0 in the offerTxHex.
takerInputTxHex: This represents the complete transaction hexadecimal of the UTXO that is being utilized to complete the atomic swap transaction.
takerVout: This refers to the output index of the UTXO being used to complete the atomic swap transaction.
paymentPrivateKey: This denotes the private key of the UTXO's owner who is paying the transaction fee.
paymentUtxo: This represents the UTXO that is being used to pay the transaction fee.

&nbsp;

```
const swapHex = stasAcceptSwap.signed(
    offerTxHex, 
    ownerPrivateKey, 
    makerInputTxHex, 
    takerInputTxHex, 
    takerVout, 
    paymentPrivateKey, 
    paymentUtxo,
    additionalOutputs // optional
)
```

&nbsp;

more on additionalOutputs soon...
After executing the function, you will receive a transaction hexadecimal representation that is now ready to be broadcasted to the miner. The final outcome of the transaction will be that input #0 will transfer ownership to output #1, while input #1 will transfer ownership to output #0, in accordance with the terms of the atomic swap transaction.

&nbsp;

### Three step swap

To make this a three step swap we can simply create the offer hex with the unsigned function call as follows:

&nbsp;

```
const unsignedOfferHex = await stasCreateSwap.unSigned(
    ownerPublicKey, 
    utxo, 
    wantedData
)
```
When the unsigned function call is made, the returned object will contain the transaction in the "tx" field, which can be converted to a string to obtain the hexadecimal format. In this scenario, input #0 will not be signed. After the stasAcceptOffer function has returned the "swapHex" value, it can then be used to sign the transaction and send it back to the offer hex creator.

&nbsp;

An additional argument must be included, which is the complete transaction hexadecimal representation of the taker, which corresponds to input #1 in the unsigned swap hexadecimal.

```
const signedSwapHex = await stasSignSwap.signed(
    unSignedSwapHex, 
    ownerPrivateKey, 
    takerInputTx
)
```
After executing the function, you will receive a transaction hexadecimal representation that is now ready to be broadcasted to the miner.

&nbsp;

### Additional outputs for atomic swaps
During the second step of the atomic swap transaction, it is possible to include additional outputs. This can be accomplished by adding an array as an additional function argument to specify the amounts and addresses to which the extra funds will be sent. It is important to note that for additional outputs, the funds must originate from input #1 UTXO in the atomic swap.
Consider the following example:

&nbsp;

Output #0 requests 1000 Native satoshis  

```
const wantedData = {
    satoshis: 1000
}
```

&nbsp;

Addtional outputs are added as follows: 
```
const additionalOutputs = [ 
    {
        address : "some address string",
        satoshis : 1000
    },
    {
        address : "some address string",
        satoshis : 1000
    }
]
```

In this case the input #1 needs to contain exactly 3000 in native satoshis to complete this transaction. This can also be done using STAS tokens where the properties of the token is splittable.

&nbsp;

## Advanced features

In this section we will go over some of the advanced transaction building features that are available in the library. 

### Data 
Certain token templates allow for data to be incorporated into transactions in varying ways. In order to maintain a universal format, the data format will always employ an array format. Each element within the array will be regarded as a single script chunk, and all data will be provided as plain text strings. Let us explore some examples of how we can leverage this feature in some of the token templates.

&nbsp;

### STAS-20 data output
The STAS-20 token template permits an optional extra output in each transaction, which is always positioned as the last output even after the payment change output. All transactional functions in the STAS library contain the "data" argument. To incorporate this additional output, we can easily provide this value as an argument in the function, as shown below:

```
const data = [
    "Some plain text string",
    "Some other plain text string"
]

const transferHex = await stasTransfer.signed(
    ownerPrivatekey, 
    stasUtxo, 
    destinationAddress, 
    paymentUtxo, 
    paymentPrivateKey,
    data
)
```
In this instance, the stasTransfer function is being utilized. An additional parameter can be included in the function if an extra output is needed in the transaction. If no data output is necessary, this parameter can be disregarded. The array can contain numerous elements, but it's important to note that the data's maximum size must not surpass 63337 bytes.

&nbsp;

### STAS-789 data append
The STAS-789 template possesses a distinctive capability to append additional data to the token script when executing a transfer transaction. The data that previously resided in the script cannot be altered and is immutable. This is an optional feature and not necessary for token transfers. To include additional data, the stasTransfer function must be supplied with the data in array format.

```
const data = [
    "Some plain text string",
    "Some other plain text string"
]

const transferHex = await stasTransfer.signed(
    ownerPrivatekey, 
    stasUtxo, 
    destinationAddress, 
    paymentUtxo, 
    paymentPrivateKey,
    data
)
```
Subsequently, the transaction output will contain the supplementary data in the script. Each element in the data array will be converted into data script chunks in ASM format. By including the data in chunks, we can introduce new OP CODES or other data that may be supported in applications that adhere to the data format.

&nbsp;

### Fee Estimates
As the name suggests, fee estimation functions offer a means of computing the expense of a STAS transaction before officially constructing it. This is accomplished using the minimum necessary arguments, which creates a transaction template that can then be used to determine the cost in satoshis based on the fee rate. The fee rate settings can be located in the utility.js file as follows:

```
this.SATS = 50
this.PERBYTE = 1000
```

&nbsp;

Here is an example of using the fee estimate functions for the stasTransfer Function : 
```
const feeEstimate = await stasTransfer.feeEstimate(stasUtxo)
```

&nbsp;

The function will return a number in satoshi value that can then be used for pre processing conditions where UTXOs for fees are required to be prepared beforehand.
&nbsp;

### ZeroChange 
Zero change transaction building is an excellent resource for developers who wish to construct STAS transactions without any change outputs. An instance of this model is when the payment UTXOs for the transactions are prearranged. By incorporating this model in conjunction with fee estimation functions, developers can minimize chained UTXO transactions by determining the exact fee amount requirement ahead of time, allowing them to create the appropriate size UTXO for the fee payment without the need to handle UTXOs afterwards as part of further fee UTXOs. This is especially handy for instances where multiple fee UTXOs are required for multiple transactions at once.

To use the zero change model in the functions it requires an arguement boolean set to true. Here is an example in the stasTransfer function 

```
const transferHex = await stasTransfer.signed(
    ownerPrivatekey, 
    stasUtxo, 
    destinationAddress, 
    paymentUtxo, 
    paymentPrivateKey,
    undefined|data,
    true
)
```
We can observe that the final argument in the stasTransfer function is set to "true". This allows for the transfer to be conducted utilizing the zero change model. It's important to note that the second-to-last argument in the function must be set to either "undefined" or, if data is required, added in as demonstrated in the preceding examples regarding data additions.


Utilizing the zero change model also involves a fallback to ensure that no significant excess in satoshis goes unaccounted for in the change output. The parameters for the zero change model can be located in the utility.js file as depicted below:

```
this.ZEROCHANGETHRESHOLD = 10
```
In this instance, if the change amount surpasses 10 satoshis, an error will be thrown, and the transaction build will not be completed. The zero change model is intended to be utilized alongside fee estimation functions to yield optimal results with minimal satoshi wastage, and to decrease the handling of excess change UTXOs when they are not required.

&nbsp;

### ZeroFee (currently not supported by existing miners)
Zero fee will create the transaction hex without any payment input UTXO or change output UTXO. This model is currently not supported by any existing miners. 

&nbsp;

### unSigned 
The unsigned features for the functions are the most advanced feature available in the library. It will create unsigned versions of the transactions and return an array of unsigned data for each input in the transaction that is not yet signed. This feature is designed to be used for wallets that may require external signatures such as web browser wallets.
The current format of data returned by this function is as follows :

```
const unsignedTxInfo = {
    unsignedData : [] - array of objects for each input in the transaction
    tx : tx - whole transaction object
}

unsignedData = [{
            inputIndex : number - index of the input being signed
            satoshis : number - satoshi converted to BN
            script : string - script buffer of the input
            sighash  : number - sighash flags for the input,
            publicKeyString : string - public key string of the input
            stas :  boolean - indicating whether the input is stas type or not
})

```
The unsigned data can be used in conjunction with the BSV library to construct a valid signature for the input(s). 


## Contributing
We welcome contributions to the library from anyone in the community. If you have found a bug, have a feature request, or would like to submit a pull request, please follow the guidelines below:

Bug Reports
If you have found a bug in the library, please report it by opening an issue on our GitHub repository. Please provide as much detail as possible, including steps to reproduce the issue and any relevant error messages.

Feature Requests
If you have a feature request for the library, please open an issue on our GitHub repository and describe the feature you would like to see. We value your feedback and will consider it as we plan future releases.

Pull Requests
If you would like to contribute code to the library, please submit a pull request on our GitHub repository. Before submitting a pull request, please ensure that your code adheres to our coding standards and that all tests pass. We will review your pull request as soon as possible and provide feedback if necessary.

Thank you for your interest in contributing to the library!

## Credits
The following individuals and organizations have contributed to the development of the library:

Cain Nussdorfer - author, reviewer and maintainer
Manoj Singh - contributor, reviewer and maintainer
Aditya Panther - contributor, reviewer and maintainer
Viral Bhadeshiya - contributor, reviewer and maintainer

We would like to express our sincere gratitude to these individuals and companies for their contributions and support, which have helped make this library a valuable resource for the community.



