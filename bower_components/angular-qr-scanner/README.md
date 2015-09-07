angular-qr-scanner
==================

Angular directive for a QR Scanner. It is the angular version of [html5-qrcode](https://github.com/dwa012/html5-qrcode) and uses [jsqrcode](https://github.com/LazarSoft/jsqrcode).

Check out the [live demo](http://sembrestels.github.io/angular-qr-scanner/).

### Usage

```html
<qr-scanner ng-success="onSuccess(data)" width="400" height="300"></qr>
```

### Install

```sh
$ bower install angular-qr-scanner
```

### Example

```html
<html ng-app="App">
<body ng-controller="qrCrtl">
<qr-scanner width="400" height="300" ng-success="onSuccess(data)" ng-error="onError(error)" />

<script src="http://ajax.googleapis.com/ajax/libs/angularjs/1.2.14/angular.js"></script>
<script src="bower_components/angular-qr-scanner/qr-scanner.js"></script>
<script src="bower_components/angular-qr-scanner/src/jsqrcode-combined.min.js"></script>
<script>

var App = angular.module('App', ['qrScanner']);

App.controller('qrCrtl', ['$scope', function($scope) {
    $scope.onSuccess = function(data) {
        console.log(data);
    };
    $scope.onError = function(error) {
        console.log(error);
    };
    $scope.onVideoError = function(error) {
        console.log(error);
    };
}]);

</script>
</body>
</html>
```

### License
The MIT License

Copyright (c) 2013-2015 Sembrestels
