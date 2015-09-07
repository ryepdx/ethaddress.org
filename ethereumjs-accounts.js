(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Accounts = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global,Buffer){
/**
ethereumjs-accounts - A suite for managing Ethereum accounts in browser.

Welcome to ethereumjs-accounts. Generate, encrypt, manage, export and remove Ethereum accounts and store them in your browsers local storage. You may also choose to extendWeb3 so that transactions made from accounts stored in browser, can be signed with the private key provided. EthereumJs-Accounts also supports account encryption using the AES encryption protocol. You may choose to optionally encrypt your Ethereum account data with a passphrase to prevent others from using or accessing your account.

Requires:
 - cryptojs v0.3.1  <https://github.com/fahad19/crypto-js>
 - localstorejs *  <https://github.com/SilentCicero/localstore>
 - ethereumjs-tx v0.4.0  <https://www.npmjs.com/package/ethereumjs-tx>
 - ethereumjs-tx v1.2.0  <https://www.npmjs.com/package/ethereumjs-util>
 - Underscore.js v1.8.3+  <http://underscorejs.org/>
 - Web3.js v0.4.2+ <https://github.com/ethereum/web3.js>

Commands:
    (Browserify)
    browserify --s Accounts index.js -o dist/ethereumjs-accounts.js

    (Run)
    node index.js

    (NPM)
    npm install ethereumjs-accounts

    (Meteor)
    meteor install silentcicero:ethereumjs-accounts
**/

var _ = require('underscore');
var Tx = require('ethereumjs-tx');
var LocalStore = require('localstorejs');
var BigNumber = require('bignumber.js');
var JSZip = require("jszip");
var FileSaver = require("node-safe-filesaver");
global.CryptoJS = require('browserify-cryptojs');
require('browserify-cryptojs/components/enc-base64');
require('browserify-cryptojs/components/md5');
require('browserify-cryptojs/components/evpkdf');
require('browserify-cryptojs/components/cipher-core');
require('browserify-cryptojs/components/aes');

/**
The Accounts constructor method. This method will construct the in browser Ethereum accounts manager.

@class Accounts
@constructor
@method (Accounts)
@param {Object} options       The accounts object options.
**/

var Accounts = module.exports = function(options){
    if(_.isUndefined(options))
        options = {};

    // setup default options
    var defaultOptions = {
        varName: 'ethereumAccounts'
        , minPassphraseLength: 6
        , requirePassphrase: false
        , selectNew: true
        , defaultGasPrice: 'useWeb3'
        , request: function(accountObject){
            var passphrase = prompt("Please enter your account passphrase for address " + accountObject.address.substr(0, 8) + '...', "passphrase");

            if(passphrase == null)
                passphrase = '';

            return String(passphrase);
        }
    };

    // build options
    this.options = _.extend(defaultOptions, options);

    // define Accounts object properties
    defineProperties(this);

    // get accounts object, if any
    var accounts = LocalStore.get(this.options.varName);

    // if no accounts object exists, create one
    if(_.isUndefined(accounts) || !_.isObject(accounts))
        LocalStore.set(this.options.varName, {});
};


/**
Pad the given string with a prefix zero, if length is uneven.

@method (formatHex)
@param {String} str    The string to pad for use as hex
@return {String} The padded or formatted string for use as a hex string
**/

var formatHex = function(str){
    return String(str).length % 2 ? '0' + String(str) : String(str);
};


/**
Prepair numbers for raw transactions.

@method (formatNumber)
@param {Number|String|BigNumber} The object to be used as a number
@return {String} The padded, toString hex value of the number
**/

var formatNumber = function(num){
    if(_.isUndefined(num) || num == 0)
        num = '00';

    if(_.isString(num) || _.isNumber(num))
        num = new BigNumber(String(num));

    if(isBigNumber(num))
        num = num.toString(16);

    return formatHex(num);
};


/**
Prepair Ethereum address for either raw transactions or browser storage.

@method (formatAddress)
@param {String} addr    An ethereum address to prep
@param {String} format          The format type (i.e. 'raw' or 'hex')
@return {String} The prepaired ethereum address
**/

var formatAddress = function(addr, format){
    if(_.isUndefined(format) || !_.isString(format))
        format = 'hex';

    if(_.isUndefined(addr)
       || !_.isString(addr))
        addr = '0000000000000000000000000000000000000000';

    if(addr.substr(0, 2) == '0x' && format == 'raw')
        addr = addr.substr(2);

    if(addr.substr(0, 2) != '0x' && format == 'hex')
        addr = '0x' + addr;

    return addr;
};


/**
Generate 16 random alpha numeric bytes.

@method (randomBytes)
@param {Number} length      The string length that should be generated
@return {String} A 16 char/UTF-8 byte string of random alpha-numeric characters
**/

var randomBytes = function(length) {
    var charset = "abcdef0123456789";
    var i;
    var result = "";
    var isOpera = Object.prototype.toString.call(window.opera) == '[object Opera]';
    if(window.crypto && window.crypto.getRandomValues) {
        values = new Uint32Array(length);
        window.crypto.getRandomValues(values);
        for(i=0; i<length; i++) {
            result += charset[values[i] % charset.length];
        }
        return result;
    } else if(isOpera) {//Opera's Math.random is secure, see http://lists.w3.org/Archives/Public/public-webcrypto/2013Jan/0063.html
        for(i=0; i<length; i++) {
            result += charset[Math.floor(Math.random()*charset.length)];
        }
        return result;
    }
    else throw new Error("Your browser sucks and can't generate secure random numbers");
}


/**
Is the object provided a Bignumber object.

@method (isBigNumber)
**/

var isBigNumber = function(value){
    if(_.isUndefined(value) || !_.isObject(value))
        return false;

    return (value instanceof BigNumber) ? true : false;
};

/**
 * Checks if the given string is an address
 *
 * @method isAddress
 * @param {String} address the given HEX adress
 * @return {Boolean}
 **/

var isAddress = function (address) {
    return /^(0x)?[0-9a-f]{40}$/.test(address);
};


/**
Define object properties such as 'length'.

@method (defineProperties)
@param {Object} context     The Accounts object context
**/

var defineProperties = function(context){
    Object.defineProperty(context, 'length', {
        get: function() {
            var count = 0;

            // count valid accounts in browser storage
            _.each(this.get(), function(account, accountIndex){
                if(_.isUndefined(account)
                  || !_.isObject(account)
                  || _.isString(account))
                    return;

                if(!_.has(account, 'encrypted')
                   || !_.has(account, 'private'))
                    return;

                count += 1;
            });

            return count;
        }
    });
};


/**
Returns true when a valid passphrase is provided.

@method (isPassphrase)
@param {String} passphrase    A valid ethereum passphrase
@return {Boolean} Whether the passphrase is valid or invalid.
**/

Accounts.prototype.isPassphrase = function(passphrase){
    if(!_.isUndefined(passphrase)
       && _.isString(passphrase)
       && !_.isEmpty(passphrase)
       && String(passphrase).length > this.options.minPassphraseLength)
        return true;
};


/**
This will set in browser accounts data at a specified address with the specified accountObject data.

@method (set)
@param {String} address          The address of the account
@param {Object} accountObject    The account object data.
**/

Accounts.prototype.set = function(address, accountObject){
    var accounts = LocalStore.get('ethereumAccounts');

    // if object, store; if null, delete
    if(_.isObject(accountObject))
        accounts[formatAddress(address)] = accountObject;
    else
        delete accounts[formatAddress(address)];

    this.log('Setting account object at address: ' + address + ' to account object ' + String(accountObject));

    LocalStore.set(this.options.varName, accounts);
};


/**
Remove an account from the Ethereum accounts stored in browser

@method (remove)
@param {String} address          The address of the account stored in browser
**/

Accounts.prototype.remove = function(address){
    this.set(address, null);
};


/**
Generate a new Ethereum account in browser with a passphrase that will encrypt the public and private keys with AES for storage.

@method (new)
@param {String} passphrase          The passphrase to encrypt the public and private keys.
@return {Object} an account object with the public and private keys included.
**/

Accounts.prototype.new = function(passphrase){
    var private = new Buffer(randomBytes(64), 'hex');
    var public = ethUtil.privateToPublic(private);
    var address = formatAddress(ethUtil.publicToAddress(public)
                                .toString('hex'));
    var accountObject = {
        address: address
        , encrypted: false
        , locked: false
        , hash: ethUtil.sha3(public.toString('hex') + private.toString('hex')).toString('hex')
    };

    // if passphrrase provided or required, attempt account encryption
    if((!_.isUndefined(passphrase) && !_.isEmpty(passphrase))
        || this.options.requirePassphrase){
        if(this.isPassphrase(passphrase)) {
            private = CryptoJS.AES
                .encrypt(private.toString('hex'), passphrase)
                .toString();
            public = CryptoJS.AES
                .encrypt(public.toString('hex'), passphrase)
                .toString();
            accountObject.encrypted = true;
            accountObject.locked = true;
        } else {
            this.log('The passphrase you tried to use was invalid.');
            private = private.toString('hex')
            public = public.toString('hex')
        }
    }else{
        private = private.toString('hex')
        public = public.toString('hex')
    }

    // Set account object private and public keys
    accountObject.private = private;
    accountObject.public = public;
    this.set(address, accountObject);

    this.log('New address created');

    // If option select new is true
    if(this.options.selectNew)
        this.select(accountObject.address);

    return accountObject;
};


/**
Select the account that will be used when transactions are made.

@method (select)
@param {String} address          The address of the account to select
**/

Accounts.prototype.select = function(address) {
    var accounts = LocalStore.get(this.options.varName);

    if(!this.contains(address))
        return;

    accounts['selected'] = address;
    LocalStore.set(this.options.varName, accounts);
};


/**
Get an account object that is stored in local browser storage. If encrypted, decrypt it with the passphrase.

@method (new)
@param {String} passphrase          The passphrase to encrypt the public and private keys.
@return {Object} an account object with the public and private keys included.
**/

Accounts.prototype.get = function(address, passphrase){
    var accounts = LocalStore.get(this.options.varName);

    if(_.isUndefined(address) || _.isEmpty(address))
        return accounts;

    if(address == 'selected')
        address = accounts.selected;

    var accountObject = {};
    address = formatAddress(address);

    if(!this.contains(address))
        return accountObject;

    accountObject = accounts[address];

    if(_.isEmpty(accountObject))
        return accountObject;

    // If a passphrase is provided, decrypt private and public key
    if(this.isPassphrase(passphrase) && accountObject.encrypted) {
        try {
            accountObject.private = CryptoJS.AES
                .decrypt(accountObject.private, passphrase)
                .toString(CryptoJS.enc.Utf8);
            accountObject.public = CryptoJS.AES
                .decrypt(accountObject.public, passphrase)
                .toString(CryptoJS.enc.Utf8);

            if(ethUtil.sha3(accountObject.public + accountObject.private).toString('hex') == accountObject.hash)
                accountObject.locked = false;
        }catch(e){
            this.log('Error while decrypting public/private keys: ' + String(e));
        }
    }

    return accountObject;
};


/**
Clear all stored Ethereum accounts in browser.

@method (clear)
**/

Accounts.prototype.clear = function(){
    this.log('Clearing all accounts');
    LocalStore.set(this.options.varName, {});
};


/**
Does the account exist in browser storage, given the specified account address.

@method (contains)
@param {String} address          The account address
@return {Boolean} Does the account exists or not given the specified address
**/

Accounts.prototype.contains = function(address){
    var accounts = LocalStore.get(this.options.varName);

    if(_.isUndefined(address)
       || _.isEmpty(address))
        return false;

    // Add '0x' prefix if not available
    address = formatAddress(address);

    // If account with address exists.
    if(_.has(accounts, address))
        return (!_.isUndefined(accounts[address]) && !_.isEmpty(accounts[address]));

    return false;
};


/**
Export the accounts to a JSON ready string.

@method (export)
@return {String} A JSON ready string
**/

Accounts.prototype.export = function(){
    this.log('Exported accounts');

    return JSON.stringify(this.get());
};


/**
Import a JSON ready string. This will import JSON data, parse it, and attempt to use it as accounts data.

@method (import)
@param {String} A JSON ready string
@return {String} How many accountObject's were added
**/

Accounts.prototype.import = function(JSON_data){
    var JSON_data = JSON_data.trim();
    var parsed = JSON.parse(JSON_data);
    var count = 0;
    var _this = this;

    _.each(parsed, function(accountObject, accountIndex){
        if(!_.has(accountObject, 'private')
           || !_.has(accountObject, 'hash')
           || !_.has(accountObject, 'address')
           || !_.has(accountObject, 'encrypted')
           || !_.has(accountObject, 'locked'))
            return;

        count += 1;
        _this.set(accountObject.address, accountObject);
    });

    this.log('Imported ' + String(count) + ' accounts');

    return count;
};


/**
Backup your accounts in a zip file.

@method (backup)
**/

Accounts.prototype.backup = function(){
    var zip = new JSZip();
    zip.file("wallet", this.export());
    var content = zip.generate({type:"blob"});
    var dateString = new Date();
    this.log('Saving wallet as: ' + "wallet-" + dateString.toISOString() + ".zip");
    FileSaver.saveAs(content, "wallet-" + dateString.toISOString() + ".zip");
};


/**
A log function that will log all actions that occur with ethereumjs-accounts.

@method (log)
**/

Accounts.prototype.log = function(){};


/**
Return all accounts as a list array.

@method (list)
@return {Array} a list array of all accounts
**/

Accounts.prototype.list = function(){
    var accounts = LocalStore.get('ethereumAccounts'),
        return_array = [];

    _.each(_.keys(accounts), function(accountKey, accountIndex){
       if(accountKey != "selected")
           return_array.push(accounts[accountKey]);
    });

    return return_array;
};


/**
Alias for contains(), but asynchronous.

This method is required to be a part of the transaction_signer specification for
the HookedWeb3Provider.

@method (hasAddress)
**/

Accounts.prototype.hasAddress = function(address, callback) {
  callback(null, this.contains(address));
}


/**
This will sign a transaction based on transaction parameters passed to it.
If the from address is not registered as an in-browser account, signTransaction
will respond with an error.

This method is required to be a part of the transaction_signer specification for
the HookedWeb3Provider.

tx_params should be an object passed directly from web3. All data should be hex
and start with the prefix "0x". nonce is required.

@method (signTransaction)
**/
Accounts.prototype.signTransaction = function(tx_params, callback) {
    // Accounts instance
    var accounts = this;

    // if from is an account is not stored in browser, error because we can't
    // sign the transaction.
    if(!accounts.contains(tx_params.from)) {
        callback(new Error("Cannot sign transaction; from address not found in accounts list."));
    }
    // Get the account of address set in sendTransaction options, from the accounts stored in browser
    var account = accounts.get(tx_params.from);

    // if the account is encrypted, try to decrypt it
    if(account.encrypted) {
        account = accounts.get(tx_params.from, accounts.options.request(account));
    }

    // if account is still locked, quit
    if(account.locked) {
        callback(new Error("Cannot sign transaction. Account locked!"));
        return;
    }

    var rawTx = {
        nonce: formatHex(ethUtil.stripHexPrefix(tx_params.nonce)),
        gasPrice: formatHex(ethUtil.stripHexPrefix(tx_params.gasPrice)),
        gasLimit: formatHex(new BigNumber('3141592').toString(16)),
        value: '00',
        data: ''
    };

    if(tx_params.gasPrice != null)
        rawTx.gasPrice = formatHex(ethUtil.stripHexPrefix(tx_params.gasPrice));

    if(tx_params.gas != null)
        rawTx.gasLimit = formatHex(ethUtil.stripHexPrefix(tx_params.gas));

    if(tx_params.to != null)
        rawTx.to = formatHex(ethUtil.stripHexPrefix(tx_params.to));

    if(tx_params.value != null)
        rawTx.value = formatHex(ethUtil.stripHexPrefix(tx_params.value));

    if(tx_params.data != null)
        rawTx.data = formatHex(ethUtil.stripHexPrefix(tx_params.data));

    // convert string private key to a Buffer Object
    var privateKey = new Buffer(account.private, 'hex');

    // init new transaction object, and sign the transaction
    var tx = new Tx(rawTx);
    tx.sign(privateKey);

    // Build a serialized hex version of the Tx
    var serializedTx = '0x' + tx.serialize().toString('hex');

    callback(null, serializedTx);
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"bignumber.js":undefined,"browserify-cryptojs":undefined,"browserify-cryptojs/components/aes":undefined,"browserify-cryptojs/components/cipher-core":undefined,"browserify-cryptojs/components/enc-base64":undefined,"browserify-cryptojs/components/evpkdf":undefined,"browserify-cryptojs/components/md5":undefined,"buffer":undefined,"ethereumjs-tx":undefined,"jszip":undefined,"localstorejs":undefined,"node-safe-filesaver":undefined,"underscore":undefined}]},{},[1])(1)
});