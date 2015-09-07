var Accounts = require('ethereumjs-accounts');

module.exports = function ($scope, $interval) {
    var that = this;
    that.accounts = new Accounts({minPassphraseLength: 1});
    that.hash = function (prefix) {
      var account = that.accounts.new();
      that.accounts.clear();
      that.intervalHashCount += 1;

      if (account.address.slice(2, prefix.length+2) == prefix) {
        return account;
      }
      return null;
    };
    that.intervalHashCount = 0;
    that.intervalStart = 0;

    $scope.wallets = [];
    $scope.HPS = 0;
    $scope.targetHPS = 200;
    $scope.searching = false;
    $scope.startSearching = function () {
      if (!$scope.prefix) return;

      $scope.wallets = [];
      $scope.searching = true;
      that.intervalStart = Date.now();

      var now = Date.now();
      var lastHashed = now;
      var prefix = $scope.prefix.toLowerCase();
      var password = $scope.usePassword ? $scope.password : undefined;
      var search = function () {
        var account = that.hash(prefix);

        if (account !== null) {
          if (password) {
            account.private = CryptoJS.AES
                .encrypt(account.private, password)
                .toString();
            account.public = CryptoJS.AES
                .encrypt(account.public, password)
                .toString();
          }
          $scope.wallets.push(account);
        }

        if (!$scope.searching) {
          $interval.cancel(searchInterval);
        }
      };
      var searchInterval = $interval(search, (1000 / $scope.targetHPS));

      var hpsInterval = $interval(function () {
        if (!$scope.searching) {
          $scope.HPS = 0;
          return;
        }

        var now = Date.now();
        $scope.HPS = that.intervalHashCount / ((now - that.intervalStart) / 1000);
        that.intervalHashCount = 0;
        that.intervalStart = now;
      }, 1000);
    };

    $scope.stopSearching = function () {
      $scope.searching = false;
      generatePages();
    };

    var pages = [];
    $scope.getPages = function () {
        if (pages.length > 0) { return pages; }
    };
    var generatePages = function () {
        var currentPage = [];
        pages = [];

        for (var i=0; $scope.wallets && i < $scope.wallets.length; i+=1) {
            currentPage.push($scope.wallets[i]);
            var pageBreak = ($scope.perPage &&
                            (i > 0 || $scope.perPage === 1) &&
                            (i+1) % $scope.perPage === 0 &&
                            (i+1 !== $scope.wallets.length));

            if (pageBreak) {
                pages.push(currentPage);
                currentPage = [];
            }
        }
        pages.push(currentPage);
        return pages;
    };

    $scope.generateWallet = function () {
      var key = ethUtil.sha3($scope.walletPhrase);
      $scope.private = key.toString('hex');
      $scope.address = '0x' + (ethUtil.publicToAddress(ethUtil.privateToPublic(key))).toString('hex');
    };
    $scope.print = function () {window.print();};
    $scope.base58 = function (hex) {
      if (!hex || isNaN(parseInt(hex, 16))) return;
      var intArray = [];
      for (var i=0; i < hex.length; i+=2) {
        intArray.push(parseInt(hex[i]+hex[i+1], 16));
      }
      return Base58.encode(intArray);
    };
    $scope.obfuscate = function (str) {
      if (!str) return;
      return str.replace(/./g, '*');
    };
    $scope.exportKeys = function () {
      var zip = new JSZip();
      for (var i=0; i < $scope.wallets.length; i+=1) {
        zip.file($scope.wallets[i].address + ".prv", $scope.wallets[i].private);
      }
      saveAs(zip.generate({type:"blob"}), "wallets.zip");
    };
};
