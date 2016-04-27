angular.module('ngCreateThumbnail', [])

.provider('CreateThumbnailService', function() {

  this.defaults = {
    targetWidth: 100,
    targetHeight: 100,
    sourceX: 0,
    sourceY: 0,
    destX: 0,
    destY: 0,
    sourceWidth: 0,
    sourceHeight: 0,
    reduceStrategy: '',
    targetType: 'blob'
  };

  this.$get = ['$q', function($q) {
    var defaults = this.defaults;

    return {

      create: function generate(sourceImage, options) {
        var deferred = $q.defer();

        options = options || {};

        function dataURLToBlob(dataURL) {
          var byteString;
          if (dataURL.split(',')[0].indexOf('base64') >= 0) {
            byteString = atob(dataURL.split(',')[1]);
          } else {
            byteString = unescape(dataURL.split(',')[1]);
          }
          var mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];

          var ia = new Uint8Array(byteString.length);
          for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          return new Blob([ia], {type:mimeString});
        };

        this.loadThumbnail(sourceImage, options).loaded.then(
          function success(canvas) {

            if (typeof canvas.toDataURL !== 'function') {
              return deferred.reject('Unsupported browser function toDataURL.');
            }

            try {

              var targetType = options.targetType || defaults.targetType;
              var base64 = canvas.toDataURL(options.type, options.encoderOptions);
              if (targetType === 'base64') {
                deferred.resolve(base64);
              } else if (targetType === 'blob') {
                var blob = dataURLToBlob(base64);
                deferred.resolve(blob);
              } else {
                return deferred.reject('Unknown targetType.');
              }

            } catch (ex) {
              deferred.reject(ex);
            }
          }
        );
        return deferred.promise;
      },

      loadThumbnail: function loadThumbnail(sourceImage, options) {
        var canvas = this.initialiseCanvas(options);
        return {
          created: $q.when(canvas),
          loaded: this.drawThumbnail(canvas, sourceImage, options)
        };
      },

      initialiseCanvas: function initialiseCanvas(options) {
        var canvas = angular.element('<canvas></canvas>')[0];
        return this.setCanvasSize(canvas, options);
      },

      setCanvasSize: function setCanvasSize(canvas, options) {
        options = options || {};

        var w = Number(options.targetWidth) || defaults.targetWidth;
        var h = Number(options.targetHeight) || defaults.targetHeight;

        canvas.width = w;
        canvas.height = h;

        return canvas;
      },

      drawThumbnail: function drawThumbnail(canvas, sourceImage, options) {

        function reduce(canvas, sourceImageWidth, sourceImageHeight, targetWidth, targetHeight, reduceStrategy) {

          var settings = {};
          var factor;

          if (sourceImageHeight > 0 && sourceImageWidth > 0) {

            if (reduceStrategy === 'shrinkCanvasToFit') {

              factor = (sourceImageHeight > sourceImageWidth ? (sourceImageWidth / targetWidth) : (sourceImageHeight / targetHeight));
              settings.destWidth = sourceImageWidth / factor;
              settings.destHeight = sourceImageHeight / factor;
              canvas.width = settings.destWidth;
              canvas.height = settings.destHeight;

            } else if (reduceStrategy === 'shrinkToFit') {

              if (sourceImageWidth > sourceImageHeight) {

                factor = sourceImageWidth / targetWidth;
                settings.destHeight = factor * targetHeight;
                settings.destY = sourceImageHeight / 2 - settings.destHeight / 2;

              } else {

                factor = sourceImageHeight / targetHeight;
                settings.destWidth = factor * targetWidth;
                settings.destX = sourceImageWidth / 2 - settings.destWidth / 2;

              }
            } else if (reduceStrategy === 'cropToFit' || reduceStrategy === '') {

              settings.destHeight = targetHeight;
              settings.destWidth = targetWidth;

              if (sourceImageWidth > sourceImageHeight) {

                factor = sourceImageHeight / targetHeight;
                settings.sourceWidth = factor * targetWidth;
                settings.sourceX = sourceImageWidth / 2 - settings.sourceWidth / 2;

              } else {

                factor = sourceImageWidth / targetWidth;
                settings.sourceHeight = factor * targetHeight;
                settings.sourceY = sourceImageHeight / 2 - settings.sourceHeight / 2;

              }
            }
          }

          return settings;
        }

        var deferred = $q.defer();

        options = options || {};

        var ctx = canvas.getContext('2d');
        var img = new Image();
        img.onload = function onload() {

          var reduceStrategy = options.reduceStrategy || defaults.reduceStrategy;
          var settings = reduce(canvas, img.width, img.height, options.targetWidth, options.targetHeight, reduceStrategy);
          var sourceWidth = Number(settings.sourceWidth) || img.width;
          var sourceHeight = Number(settings.sourceHeight) || img.height;
          var sourceX = Number(settings.sourceX) || defaults.sourceX;
          var sourceY = Number(settings.sourceY) || defaults.sourceY;
          var destX = Number(settings.destX) || defaults.destX;
          var destY = Number(settings.destY) || defaults.destY;
          var destWidth = Number(settings.destWidth) || canvas.width;
          var destHeight = Number(settings.destHeight) || canvas.height;

          ctx.drawImage(img, sourceX, sourceY,  sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);

          deferred.resolve(canvas);
        };

        img.src = sourceImage;

        return deferred.promise;
      }
    };
  }];
})

.directive('uiThumbnailJames', function(CreateThumbnailService) {

  return {

    restrict: 'E',

    scope: {
      src: '=',
      options: '='
    },

    link: function link(scope, el, attrs) {
      var promises = CreateThumbnailService.loadThumbnail(scope.src, scope.options);

      promises.created.then(
        function created(canvas) {
          // can be appended at this point
          el.append(canvas);
        }
      );

      promises.loaded.then(
        function loaded(canvas) {
          scope.$watch('src', function(newSrc) {
            CreateThumbnailService.drawThumbnail(canvas, newSrc);
          });
          scope.$watchCollection('options', function(newOptions) {
            CreateThumbnailService.setCanvasSize(canvas, newOptions);
            // need to redraw
            CreateThumbnailService.drawThumbnail(canvas, scope.src, newOptions);
          });
        }
      );
    }
  };
});
