module.exports = function (app) {
  app.directive('onClickSelectAll', ['$window', function ($window) {
    return {
      link: function (scope, element) {
        element.on('click', function () {
          var selection = $window.getSelection();        
          var range = document.createRange();
          range.selectNodeContents(element[0]);
          selection.removeAllRanges();
          selection.addRange(range);
        });
      }
    };
  }])
  .directive('cssImg', function () {
    return {
      restrict: 'E',
      scope: {},
      replace: true,
      template: '<img src="{{src}}" />',
      link: function (scope, element) {
        scope.src = $(element).css('background-image').replace(/^url\(['|"]?/, '').replace(/['|"]?\)$/, '');
      }
    };
  });
};
