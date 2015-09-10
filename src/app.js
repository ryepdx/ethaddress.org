var angular = require('angular');

var app = angular.module('paperwallet', [
    'ui.materialize', 'monospaced.qrcode', 'icon-identicon', 'ui.router', 'qrScanner'
]);
(require('./directives'))(app);

var partials = require('./partials');
var controllers = require('./controllers');

app.config(['$stateProvider', '$urlRouterProvider',
function ($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/');
  $stateProvider
    .state('singleWallet', {
      url: '/', template: partials.singleWallet,
      controller: controllers.singleWallet
    })
    .state('bulkWallets', {
      url: '/bulkWallets', template: partials.bulkWallets,
      controller: controllers.bulkWallets
    })
    .state('brainWallet', {
      url: '/brainWallet', template: partials.brainWallet,
      controller: controllers.brainWallet
    })
    .state('vanityWallet', {
      url: '/vanityWallet', template: partials.vanityWallet,
      controller: controllers.vanityWallet
    })
    .state('splitWallet', {
      url: '/splitWallet', template: partials.splitWallet,
      controller: controllers.splitWallet
    })
    .state('importWallet', {
      url: '/importWallet', template: partials.importWallet,
      controller: controllers.importWallet
    })
    .state('about', {
      url: '/about', template: partials.about,
    });
}]);
