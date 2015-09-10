var CryptoJS = require("crypto-js");

module.exports = ['$scope', function ($scope) {
  var qr = new QrCode();

  $scope.scanningQR = false;
  $scope.decodeQR = function (data) {
    if (data.slice(0,5) == "error") return;
    $scope.$apply(function () {
      $scope.key = data;
      $scope.scanningQR = false;
    });
  };
  qr.callback = $scope.decodeQR;

  $scope.qrUploaded = function (e) {
    qr.decode(URL.createObjectURL(document.getElementById("qr-input").files[0]));
  };

  $scope.canScan = Boolean(navigator.getUserMedia ||
                           navigator.webkitGetUserMedia ||
                           navigator.mozGetUserMedia ||
                           navigator.msGetUserMedia) &&
                   Boolean(MediaStreamTrack && 
                           MediaStreamTrack.getSources);

  $scope.cannotScan = function () {
    $scope.$apply(function () {
      $scope.canScan = false;
    });
  };

  $scope.toggleQRScanning = function () {
    $scope.scanningQR = !$scope.scanningQR;
  };

  $scope.videoSource = null;
  
  if (typeof MediaStreamTrack !== 'undefined' && typeof MediaStreamTrack.getSources !== 'undefined') {
    MediaStreamTrack.getSources(function(sources) {
      $scope.$apply(function () {
        for (var i = 0, len = sources.length; i<len; i++) {
          if (sources[i].kind !== "video") continue;
          if (sources[i].facing == "environment") {
            $scope.videoSource = sources[i].id;
          }
        }
      });
    });
  }

  $scope.uploadQR = function () {
    $scope.scanningQR = false;
    document.getElementById("qr-input").click();
  };

  $scope.uploadWallet = function () {
    document.getElementById("file-input").click();
  };

  $scope.cancelDecrypt = function () {
    $scope.encryptedWallet = null;
    $scope.error = null;
  };

  $scope.decrypt = function () {
    if ($scope.encryptedWallet.decrypt($scope.password)) {
      $scope.key = $scope.encryptedWallet.private;
      $scope.encryptedWallet = null;
      $scope.password = '';
      $scope.error = null;

    } else {
      $scope.error = $scope.encryptedWallet.error;
    }
  };

  var filereader = new FileReader();
  $scope.walletUploaded = function (elem) {
    var file = elem.files[0];
    if (!file) return;
    filereader.onload = function (evt) {
      $scope.$apply(function () {
        parseWalletFile(evt.target.result);
      });
    };
    filereader.readAsText(file);
  };

  var parseWalletFile = function (data) {
    if (isKey(data)) {
      $scope.key = data;
      $scope.encryptedWallet = null;
      return;
    }

    try {
      data = JSON.parse(data);

    } catch (e) {
      data = {private: data};
    }

    if (typeof(data.locked) !== 'undefined' && !data.locked && isKey(data.private)) {
      $scope.key = data.private;
      $scope.encryptedWallet = null;
      return;
    }

    $scope.encryptedWallet = new EncryptedWallet(data);
  }; 

  var isKey = function (key) {
    return /^(0x)?[0-9a-fA-F]{64}$/.test(key);
  };

  var isEncryptedKey = function (key) {
    return /^[A-Za-z0-9\/\+]{128,132}$/.test(key);
  };

  $scope.$watch("key", function (key) {
    $scope.address = '';
    $scope.keyEntered = isKey(key);
    
    if (isEncryptedKey(key)) {
      parseWalletFile(key);
    }
  });

  $scope.$watch("keyEntered", function (entered) {
    if (!entered) return;

    parseWalletFile($scope.key);
    $scope.address = '0x' + ethUtil.publicToAddress(
      ethUtil.privateToPublic(new Buffer($scope.key, 'hex'))
    ).toString('hex');
  });

  $scope.print = function () {window.print();};
}];

var EncryptedWallet = function (json) {
  this.data = json;
  this.unlocked = false;
};

EncryptedWallet.prototype.setPrivateKey = function (key) {
  this.private = key;
  this.public = ethUtil.privateToPublic(this.hexToBytes(this.private));
  var address = ethUtil.publicToAddress(this.public).toString('hex');
  this.address = '0x' + this.normalizeHex(address);
  return this.unlocked;
};

EncryptedWallet.prototype.getError = function (addressHash) {
  var error = null;
  var expectedAddress = this.data.ethaddr || this.data.address;
  
  if (!expectedAddress) return;

  if (addressHash) {
    var hash = CryptoJS.enc.Hex.stringify(CryptoJS.SHA3(this.address));

    if (hash.slice(-4) != addressHash) {
      error = "Incorrect wallet password. (Hash mismatch.)";
    }

  } else if (this.normalizeHex(this.address) !== this.normalizeHex(expectedAddress)) {
    error = this.private ? "Incorrect wallet password." : "Private key not set!";
  }

  this.error = error;
  this.unlocked = !Boolean(this.error);

  return error;
};

EncryptedWallet.prototype.decrypt = function (password) {
  var kdfJSON;
  var mode;
  var padding;
  var that = this;

  if (this.data.encseed) {
    var seedBytes = this.hexToBytes(this.data.encseed);

    kdfJSON = {
      kdf: 'pbkdf2',
      kdfparams: {c: 2000, dklen: 16, salt: this.stringToHex(password)},
      cipherparams: {iv: this.bytesToHex(seedBytes.slice(0, 16))},
      ciphertext: this.bytesToHex(seedBytes.slice(16))
    };
    mode = CryptoJS.mode.CBC;
    padding = CryptoJS.pad.Pkcs7;

  } else {
    kdfJSON = this.data.Crypto || this.data.crypto;
    mode = CryptoJS.mode.CTR;
    padding = CryptoJS.pad.ZeroPadding;
  }

  if (!kdfJSON || !kdfJSON.kdfparams) {
    return this.decryptText(this.data.private, password);
  }

  var derivedKey = this.KDF(kdfJSON, password);
  var passwordBytes = derivedKey.slice(0, 16);
  var decrypted = CryptoJS.AES.decrypt({
    ciphertext: CryptoJS.enc.Hex.parse(kdfJSON.ciphertext)
  }, CryptoJS.enc.Hex.parse(this.bytesToHex(passwordBytes)), {
    mode: mode,
    padding: padding,
    iv: CryptoJS.enc.Hex.parse(kdfJSON.cipherparams.iv)
  });

  decrypted = CryptoJS.enc.Hex.stringify(decrypted);

  if (this.data.encseed) {
    decrypted = CryptoJS.SHA3(this.hexToString(decrypted), {
      outputLength: 256
    }).toString();
  }

  this.setPrivateKey(decrypted);
  return !Boolean(this.getError());
};

EncryptedWallet.prototype.decryptText = function (text, password) {
  var textBytes = CryptoJS.AES.decrypt(text.slice(0, 128), password);
  var decrypted = this.hexToString(CryptoJS.enc.Hex.stringify(textBytes));
  
  this.setPrivateKey(decrypted);

  if (text.length == 132) {
    return !Boolean(this.getError(text.slice(-4)));
  }

  return !Boolean(this.getError());
};

EncryptedWallet.prototype.scrypt = function (malloc) {
  if (!this._scrypt) {
    this._scrypt = scrypt_module_factory(malloc || 33554432 * 10);
  }
  return this._scrypt;
};

EncryptedWallet.prototype.normalizeHex = function (hex) {
  return hex.match(/^(0x)?([0-9a-fA-F]+$)/)[2].toLowerCase();
};

EncryptedWallet.prototype.KDF = function (crypto, password) {
  var params = crypto.kdfparams;
  var salt = this.hexToBytes(params.salt);
  password = this.stringToBytes(password);

  if(crypto.kdf == "pbkdf2") {
    return sha256.pbkdf2(password, salt, params.c, params.dklen);
  }
  
  if (crypto.kdf == "scrypt") {
    return this.scrypt().crypto_scrypt(
        password, salt, params.n, params.r, params.p, params.dklen);
  }
};

EncryptedWallet.prototype.stringToBytes = function (string) {
  var bytes = [];
  for (var i=0; i < string.length; i+=1) {
    bytes.push(string.charCodeAt(i));
  }
  return bytes;
};

EncryptedWallet.prototype.stringToHex = function (string) {
  var hex = "";
  for (var i=0; i < string.length; i+=1) {
    hex += (string.charCodeAt(i) >>> 4).toString(16);
    hex += (string.charCodeAt(i) & 0xF).toString(16);
  }
  return hex;

};
EncryptedWallet.prototype.hexToBytes = function (hex) {
  var bytes = [];
  for (var i=0; i < hex.length; i+=2) {
    bytes.push(parseInt(hex.slice(i, i+2), 16));
  }
  return bytes;
};

EncryptedWallet.prototype.bytesToHex = function (bytes) {
  var hex = "";
  for (var i=0; i < bytes.length; i+=1) {
    hex += (bytes[i] >>> 4).toString(16);
    hex += (bytes[i] & 0xF).toString(16);
  } 
  return hex;
};

EncryptedWallet.prototype.hexToString = function (hex) {
  hex = hex.toString();
  var string = "";
  for (var i = 0; i < hex.length; i += 2) {
    string += String.fromCharCode(parseInt(hex.slice(i, i+2), 16));
  }
  return string;
};

