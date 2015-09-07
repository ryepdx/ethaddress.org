(function() {
'use strict';

angular.module('qrScanner', [])
  .directive('qrScanner', ['$interval', '$window', function($interval, $window) {
    return {
      restrict: 'E',
      scope: {
        ngSuccess: '&ngSuccess',
        ngError: '&ngError',
        ngVideoError: '&ngVideoError',
        ngVideoSource: '=ngVideoSource'
      },
      link: function(scope, element, attrs) {

        window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

        var height = attrs.height || 300;
        var width = attrs.width || 250;

        var video = $window.document.createElement('video');
        video.setAttribute('autoplay', true);
        video.setAttribute('width', width);
        video.setAttribute('height', height);
        var canvas = $window.document.createElement('canvas');
        canvas.setAttribute('id', 'qr-canvas');
        canvas.setAttribute('style', 'display:none;');

        angular.element(element).append(video);
        angular.element(element).append(canvas);
        var context = canvas.getContext('2d');
        var stopScan;

        var qrcode = new QrCode();
        var once = false;
        var scan = function() {
          if ($window.localMediaStream) {
            canvas.setAttribute('width', angular.element(video)[0].videoWidth);
            canvas.setAttribute('height', angular.element(video)[0].videoHeight);
            context.drawImage(video, 0, 0, angular.element(video)[0].videoWidth, angular.element(video)[0].videoHeight);
            try {
              qrcode.decode(canvas.toDataURL("image/png"));
            } catch(e) {
              scope.ngError({error: e});
            }
          }
        };

        var once = false;
        var successCallback = function(stream) {
          video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
          $window.localMediaStream = stream;

          scope.video = video;
          video.play();
          stopScan = $interval(scan, 100);
        };

        var startVideo = function(source) {
          var option;
          if (!source) option = true;
          else option = {
              optional: [{
                sourceId: source
              }]
            };

          // Call the getUserMedia method with our callback functions
          if (navigator.getUserMedia) {
            navigator.getUserMedia({video: option}, successCallback, function(e) {
              scope.ngVideoError({error: e});
            });
          } else {
            scope.ngVideoError({error: 'Native web camera streaming (getUserMedia) not supported in this browser.'});
          }

          qrcode.callback = function(data) {
            scope.ngSuccess({data: data});
          };
        };
        if(typeof scope.ngVideoSource == 'undefined') {
          startVideo(null);
        }

        scope.$watch('ngVideoSource', function(newValue, oldValue) {
          if (typeof MediaStreamTrack === 'undefined' ||
            typeof MediaStreamTrack.getSources === 'undefined') {
            console.log('This browser does not support MediaStreamTrack')
          } else {
            MediaStreamTrack.getSources(function(sources) {
              for (var i = 0, len = sources.length; i<len; i++)
                if (sources[i].id == newValue) {
                  video.pause();
                  $interval.cancel(stopScan);
                  startVideo(newValue);
                  break;
                }
            });
          }
        });

        element.bind('$destroy', function() {
          if ($window.localMediaStream) {
            $window.localMediaStream.stop();
          }
          if (stopScan) {
            $interval.cancel(stopScan);
          }
        });
      }
    }

  }
]);
})();
