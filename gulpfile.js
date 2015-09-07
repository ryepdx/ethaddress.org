var gulp = require('gulp');
var filter = require('gulp-filter');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');
var concatCSS = require('gulp-concat-css');
var purifycss = require('gulp-purifycss');
var inlinesource = require('gulp-inline-source');
var inline_base64 = require('gulp-inline-base64');
var mainBowerFiles = require('main-bower-files');
var replace = require('gulp-replace');
var jshint = require('gulp-jshint');
var rm = require('gulp-rm');
var source = require('vinyl-source-stream');
var browserify = require('browserify');

var getFileGlobs = function () {
    return ['src/lib/*.js'].concat(mainBowerFiles()).concat(['src/css/*.css']);
};
var allFiles = getFileGlobs();

gulp.task('watch', ['build'], function () {
  gulp.watch(allFiles, ['build']);
});

gulp.task('clean', function () {
  return gulp.src(['build/**/*'], {read: false}).pipe(rm());
});

gulp.task('hint', function () {
  return gulp.src(['src/*.js', 'src/**/*.js', '!src/lib', '!src/lib/**'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('compile', ['clean'], function () {
  allFiles = getFileGlobs();
  var jsFilter = filter('*.js', {restore: true});
  var cssFilter = filter('*.css', {restore: true});
  var fontFilter = filter(['*.eot', '*.woff', '*.woff2', '*.svg', '*.ttf'], {restore: true}); 

  return gulp.src(allFiles)
    .pipe(fontFilter)
    .pipe(gulp.dest('./fonts'))
    .pipe(fontFilter.restore)
    .pipe(jsFilter)
    .pipe(concat('bower.js'))
    .pipe(uglify({mangle: false}))
    .pipe(gulp.dest('./build'))
    .pipe(jsFilter.restore)
    .pipe(cssFilter)
    .pipe(purifycss(["./src/index.html", "./partials/*.html", "./build/bower.js"]))
    .pipe(replace(/(\.\.\/)*font\/[^\/]+/ig, './fonts'))
    .pipe(inline_base64({baseDir: './'}))
    .pipe(concatCSS('all.css'))
    .pipe(minifyCSS())
    .pipe(replace(/@font-face{font-family:Material-Design-Icons[^}]*}/ig, ''))
    .pipe(gulp.dest('./build'))
    .pipe(cssFilter.restore);
});

gulp.task('inlinesource', ['compile', 'browserify'], function () {
    return gulp.src('./src/index.html')
        .pipe(inlinesource({compress: false, rootpath: __dirname}))
        .pipe(gulp.dest('.'));
});

gulp.task('browserify', ['clean', 'compile', 'hint'], function() {
   return browserify('src/app.js')
      .bundle()
      .pipe(source('npm.js'))
      .pipe(gulp.dest('./build'));
});

gulp.task('build', ['compile', 'browserify', 'inlinesource']);

gulp.task('default', ['build', 'watch']);
