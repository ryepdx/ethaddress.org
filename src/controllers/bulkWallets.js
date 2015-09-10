var Accounts = require('ethereumjs-accounts');

module.exports = ['$scope', function ($scope) {
    var that = this;
    $scope.wallets = [];
    that.accounts = new Accounts({minPassphraseLength: 1});
    that.generateWallet = function () {
      return $scope.usePassword ? that.accounts.new($scope.password) : that.accounts.new();
    };
    $scope.print = function () {window.print();};

    $scope.generateWallets = function () {
        $scope.wallets = [];
        for (var i=0; i < parseInt($scope.numWallets); i+=1) {
            $scope.wallets.push(that.generateWallet());
        }
        that.accounts.clear();

        $scope.walletCSV = [];
        for (var j=0; j < $scope.wallets.length; j+=1) {
            $scope.walletCSV.push((j+1) + ',"' + $scope.wallets[j].address + '","' + $scope.wallets[j].private); 
        }
        $scope.walletCSV = $scope.walletCSV.join("\n");
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
    $scope.$watch('wallets', generatePages);

    $scope.base58 = function (hex) {
      if (!hex || isNaN(parseInt(hex, 16))) return;
      var intArray = [];
      for (var i=0; i < hex.length; i+=2) {
        intArray.push(parseInt(hex[i]+hex[i+1], 16));
      }
      return Base58.encode(intArray);
    };
    $scope.exportKeys = function () {
      var zip = new JSZip();
      for (var i=0; i < $scope.wallets.length; i+=1) {
        zip.file($scope.wallets[i].address + ".prv", $scope.wallets[i].private);
      }
      saveAs(zip.generate({type:"blob"}), "wallets.zip");
    };
    $scope.generateWallets();
}];
