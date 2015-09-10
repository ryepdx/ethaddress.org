module.exports = ['$scope', function ($scope) {
    $scope.generateWallet = function () {
      var key = ethUtil.sha3($scope.walletPhrase);
      $scope.private = key.toString('hex');
      $scope.address = '0x' + ethUtil.publicToAddress(
        ethUtil.privateToPublic(new Buffer(key, 'hex'))
      ).toString('hex');
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
      saveAs(new Blob([$scope.private], {type: "text/plain;charset=utf-8"}), $scope.address + ".prv");
    };
}];
