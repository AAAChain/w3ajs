import {Apis} from "w3ajs-ws";
let {ChainStore, FetchChain, PrivateKey, key, TransactionBuilder} = require("w3ajs");

let witness = "ws://47.98.107.96:21012";

let privKeyRegistar = "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3";
let pKeyRegistar = PrivateKey.fromWif(privKeyRegistar);
console.log(pKeyRegistar.toPublicKey().toPublicKeyString());

let seed = "Let beautiful be a hello in the southwest of the cannon gun go them city the atmosphere from the waters";
let privkey_new_account = PrivateKey.fromSeed( key.normalize_brainKey(seed) );
console.log(privkey_new_account.toPublicKey().toPublicKeyString());



Apis.instance(witness, true).init_promise.then((res) => {
    ChainStore.init(false).then(() => {
        create_account("nathan", "nathan", 30, "tester-01", privkey_new_account.toPublicKey().toPublicKeyString(), privkey_new_account.toPublicKey().toPublicKeyString());
    });
});

function create_account(registrarAccountName, referrerAccountName, referrerPercent, newAccountName, ownerPubkey, ActivePubkey) {
    let feeAmount = {
        amount: 0.01,
        asset: "AAA"
    };
    Promise.all([
        FetchChain("getAccount", registrarAccountName),
        FetchChain("getAccount", referrerAccountName),
        FetchChain("getAsset", feeAmount.asset)
    ]).then((res) = > {
        // console.log("got data:", res);
        let [registrarAccount, referrerAccount, feeAsset] = res;
        let tr = new TransactionBuilder();
        tr.add_type_operation("account_create", {
            fee: {
                amount: 0.001,
                asset_id: feeAsset.get("id")
            },
            registrar: registrarAccount.get("id"),
            referrer: referrerAccount.get("id"),
            referrer_percent: referrerPercent,
            name: newAccountName,
            owner: {
                weight_threshold: 1,
                account_auths: [],
                key_auths: [[ownerPubkey, 1]],
                address_auths: []
            },
            active: {
                weight_threshold: 1,
                account_auths: [],
                key_auths: [[activePubkey, 1]],
                address_auths: []
            },
            options: {
                memo_key: activePubkey,
                voting_account: "1.2.5",
                num_witness: 0,
                num_committee: 0,
                votes: []
            }
        });
        tr.set_required_fees().then(() = > {
            tr.add_signer(privKeyRegistar, privKeyRegistar.toPublicKey().toPublicKeyString());
            console.log("serialized transaction:", tr.serialize());
            tr.broadcast();
        });
    });
}
