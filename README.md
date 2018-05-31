# w3ajs

Pure JavaScript library for node.js and browsers. Can be used to construct, sign and broadcast transactions in JavaScript, and to easily obtain data from the blockchain via public apis.

[![npm version](https://img.shields.io/npm/v/bitsharesjs.svg?style=flat-square)](https://www.npmjs.com/package/w3ajs)
[![npm downloads](https://img.shields.io/npm/dm/bitsharesjs.svg?style=flat-square)](https://www.npmjs.com/package/w3ajs)


## Setup

This library can be obtained through npm:
```
npm install w3ajs
```

## Usage

Three sub-libraries are included: `ECC`, `Chain` and `Serializer`. Generally only the `ECC` and `Chain` libraries need to be used directly.

### Chain
This library provides utility functions to handle blockchain state as well as a login class that can be used for simple login functionality using a specific key seed.

#### Login
The login class uses the following format for keys:

```
keySeed = accountName + role + password
```

Using this seed, private keys are generated for either the default roles `active, owner, memo`, or as specified. A minimum password length of 12 characters is enforced, but an even longer password is recommended. Three methods are provided:

```
generateKeys(account, password, [roles])
checkKeys(account, password, auths)
signTransaction(tr)
```

The auths object should contain the auth arrays from the account object. An example is this:

```
{
    active: [
        ["GPH5Abm5dCdy3hJ1C5ckXkqUH2Me7dXqi9Y7yjn9ACaiSJ9h8r8mL", 1]
    ]
}
```

If checkKeys is successful, you can use signTransaction to sign a TransactionBuilder transaction using the private keys for that account.

#### State container
The Chain library contains a complete state container called the ChainStore. The ChainStore will automatically configure the `set_subscribe_callback` and handle any incoming state changes appropriately. It uses Immutable.js for storing the state, so all objects are return as immutable objects. It has its own `subscribe` method that can be used to register a callback that will be called whenever a state change happens.

The ChainStore has several useful methods to retrieve, among other things, objects, assets and accounts using either object ids or asset/account names. These methods are synchronous and will return `undefined` to indicate fetching in progress, and `null` to indicate that the object does not exist.

```
import {Apis} from "w3ajs-ws";
let {ChainStore, FetchChain, PrivateKey, key, TransactionBuilder} = require("w3ajs");
    
let seed = "Let beautiful be a hello in the southwest of the cannon gun go them city the atmosphere from the wate";
// generate private key from seed words
let privatekey = PrivateKey.fromSeed( key.normalize_brainKey(seed) );
// generate public key from private key
let publickey = privatekey.toPublicKey();
console.log(publickey.toPublicKeyString());
    
Apis.instance("ws://[ip]:[port]", true).init_promise.then((res) => {
    console.log("connected to:", res[0].network);
    // get account by name
    Apis.instance().db_api().exec( "get_account_by_name", [ name ]).then(function(account) {
        console.log(account);
    });
    ChainStore.init().then(() => {
        ChainStore.subscribe(updateState);
    });
});

let dynamicGlobal = null;
function updateState(object) {
    dynamicGlobal = ChainStore.getObject("2.1.0");
    console.log("ChainStore object update\n", dynamicGlobal ? dynamicGlobal.toJS() : dynamicGlobal);
}

```

### ECC
The ECC library contains all the crypto functions for private and public keys as well as transaction creation/signing.

#### Private keys
As a quick example, here's how to generate a new private key from a seed (a brainkey for example):

```
var {PrivateKey, key} = require("bitsharesjs");

let seed = "THIS IS A TERRIBLE BRAINKEY SEED WORD SEQUENCE";
let pkey = PrivateKey.fromSeed( key.normalize_brainKey(seed) );

console.log("\nPrivate key:", pkey.toWif());
console.log("Public key :", pkey.toPublicKey().toString(), "\n");
```

#### Transactions
```
let {ChainStore, FetchChain, PrivateKey, key, Aes, ops, hash, Signature, TransactionHelper, TransactionBuilder} = require("w3ajs");
function callback_thx_broadcast_ok(id) {
    console.log("transaction - " + id + " has been sent to chain network.");
}
ChainStore.init().then(() => {
    let fromAccountName = "nathan";
    let memoSenderName = "nathan";
    let sendAmount = {
        amount: 1000,
        asset: "AAA"
    };
    let tr = new TransactionBuilder();
    Promise.all([
        FetchChain("getAccount", fromAccountName),
        FetchChain("getAccount", "shenbaiwan"),
        FetchChain("getAccount", memoSenderName),
        FetchChain("getAsset", sendAmount.asset),
        FetchChain("getAsset", sendAmount.asset)
    ]).then((res) => {
        // console.log("got data:", res);
        let [fromAccount, toAccount, memoSender, sendAsset, feeAsset] = res;
        if(typeof memo === 'string' || memo instanceof String)
           memo = new Buffer(memo);
        // Memos are optional, but if you have one you need to encrypt it here
        let memoFromKey = memoSender.getIn(["options", "memo_key"]);
        console.log("memo pub key:", memoFromKey);
        let memoToKey = toAccount.getIn(["options", "memo_key"]);
        console.log("memo to key:", memoToKey);
        let nonce = TransactionHelper.unique_nonce_uint64();

        let memo_object = {
            from: memoFromKey,
            to: memoToKey,
            nonce,
            message: Aes.encrypt_with_checksum(
                pKey,
                memoToKey,
                nonce,
                memo
            )
        };
        tr.add_type_operation("transfer", {
            fee: {
                amount: 0,
                asset_id: feeAsset.get("id")
            },
            from: fromAccount.get("id"),
            to: toAccount.get("id"),
            amount: {amount: sendAmount.amount, asset_id: sendAsset.get("id")},
            memo: memo_object
        });
        tr.add_signer(pKey);
        return tr.set_required_fees();
    }).then(() => {
        return tr.broadcast(callback_thx_broadcast_ok);
    }).catch((ex) => {
        console.log(ex);
    });
});
```

## ESDoc (beta)
```bash
npm i -g esdoc esdoc-es7-plugin
esdoc -c ./esdoc.json
open out/esdoc/index.html
```
