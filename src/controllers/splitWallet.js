var Accounts = require('ethereumjs-accounts');

module.exports = ['$scope', function ($scope) {
    var that = this;

    $scope.shares = [];
    $scope.derivedWallet = null;
    that.accounts = new Accounts({minPassphraseLength: 1});
    that.filterEmpties = function (input) {
        var output = [];
        for (var i=0; i < input.length; i+=1) {
            if (!input[i] || (input[i].trim && input[i].trim() === "")) continue;
            output.push(input[i].trim());
        }
        return output;
    };

    $scope.shareID = function(share) {
        return ethUtil.sha3(share).toString("hex");
    };

    $scope.deriveWallet = function () {
        var shares = that.filterEmpties($scope.sharesInput.split(/[,\n \t]/));
        var secret = secrets.combine(shares);
        $scope.derivedWallet = {
            private: secret,
            address: '0x' + ethUtil.publicToAddress(
                ethUtil.privateToPublic(new Buffer(secret, 'hex'))
            ).toString('hex') 
        };
    };

    $scope.generateWallet = function () {
        $scope.wallet = that.accounts.new();
        $scope.shares = [null].concat(
            secrets.share($scope.wallet.private, parseInt($scope.numShares), parseInt($scope.requiredShares))
        );
        $scope.requiredSharesStatic = $scope.requiredShares;

        $scope.walletCSV = [];
        for (var j=0; j < $scope.shares.length; j+=1) {
            $scope.walletCSV.push((j+1) + ',"' + $scope.wallet.address + '","' + $scope.shares[j]); 
        }
        $scope.walletCSV = $scope.walletCSV.join("\n");
        $scope.sharesInput = that.filterEmpties($scope.shares).join("\n");
        that.accounts.clear();
    };
    $scope.print = function () {window.print();};

    var pages = [];
    $scope.getPages = function () {
        if (pages.length > 0) { return pages; }
    };

    var generatePages = function () {
        var currentPage = [];
        pages = [];

        for (var i=0; $scope.shares && i < $scope.shares.length; i+=1) {
            currentPage.push($scope.shares[i]);
            var pageBreak = ($scope.perPage &&
                            (i > 0 || $scope.perPage === 1) &&
                            (i+1) % $scope.perPage === 0 &&
                            (i+1 !== $scope.shares.length));

            if (pageBreak) {
                pages.push(currentPage);
                currentPage = [];
            }
        }
        pages.push(currentPage);
        return pages;
    };
    $scope.$watch('shares', generatePages);

    $scope.exportKeys = function () {
      var zip = new JSZip();
      for (var i=0; i < $scope.shares.length; i+=1) {
        zip.file(wallet.address + "." + (i+1) + ".prv", $scope.shares[i].private);
      }
      saveAs(zip.generate({type:"blob"}), "wallets.zip");
    };
}];
