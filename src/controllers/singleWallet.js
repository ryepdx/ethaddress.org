var Accounts = require('ethereumjs-accounts');

module.exports = ['$scope', function ($scope) {
    $scope.accounts = new Accounts({minPassphraseLength: 1});
    $scope.generateWallet = function () {
      var account = $scope.accounts.new($scope.password);
      $scope.wallet = account;
      $scope.accounts.clear();
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
    $scope.exportKey = function () {
      saveAs(new Blob([$scope.wallet.private], {type: "text/plain;charset=utf-8"}), $scope.wallet.address + ".prv");
    };
    $scope.generateWallet();
}];
