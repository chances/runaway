/**
 * Created by Chance Snow on 12/7/14.
 */

var gulp = require('gulp');
var del = require('del');
var path = require('path');
var sourcemaps = require('gulp-sourcemaps');
var ts = require('gulp-typescript');
var concat = require('gulp-concat');

var source = 'ts/**/*.ts';

var tsProject = ts.createProject({
    target: 'es5',
    sourceMap: true,
    removeComments : false,
    noImplicitAny: true,
    declarationFiles: false,
    noExternalResolve: true
});

gulp.task('clean', function (callback) {
    del(['js/**/*.js', '!js/lib/*.js'], function (error) {
        if (error) {
            return callback(error);
        }
        callback();
    });
});

gulp.task('typescript', function () {
    var tsResult = gulp.src(source)
        .pipe(sourcemaps.init())
        .pipe(ts(tsProject, undefined, ts.reporter.fullReporter()));

    tsResult.js
        .pipe(concat('runaway.ts.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('js/'));
});

gulp.task('watch', ['typescript'], function () {
    var watcher = gulp.watch(source, ['typescript']);
    watcher.on('change', function (event) {
        var filename = path.basename(event.path);
        console.log(filename + ' was ' + event.type + ', compiling project...');
    });
});

gulp.task('ts', ['typescript']);
gulp.task('build', ['clean', 'typescript']);
gulp.task('default', ['watch']);
