var gulp = require('gulp');
var gutil = require('gulp-util');
var del = require('del');
var path = require('path');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var runSequence = require('run-sequence');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var ts = require('gulp-typescript');
var browserify = require('browserify');
var watchify = require('watchify');

var tsSource = ['ts/**/*.ts'];
var builtSource = ['js/**/*.js', '!js/lib/*.js'];
var builtDistSource = ['js/runaway.built.js'];
var distSource = ['js/runaway.js'];

var tsProject = ts.createProject({
    target: 'es5',
    module: 'commonjs',
    sourceMap: true,
    removeComments : false,
    noImplicitAny: true,
    declarationFiles: false,
    noExternalResolve: true
});

var b = browserify({
    cache: {}, packageCache: {},
    entries: ['./js/main.js'],
    debug: true
});
var bw = watchify(b);

gulp.task('clean', function (callback) {
    del(builtSource, function (error) {
        if (error) {
            return callback(error);
        }
        callback();
    });
});

gulp.task('typescript', function () {
    var tsResult = gulp.src(tsSource, { base: path.join(__dirname, 'ts/') })
        .pipe(sourcemaps.init())
        .pipe(ts(tsProject, undefined, ts.reporter.fullReporter()));

    return tsResult.js
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('js/'));
});

gulp.task('watch', function () {
    var watcher = gulp.watch(tsSource, function () {
        runSequence('typescript', function () {
            runSequence('bundle', function () {
                finishBundling();
            });
        });
    });
    watcher.on('change', function (event) {
        var filename = path.basename(event.path);
        console.log(filename + ' was ' + event.type + ', compiling...');
    });
});

gulp.task('bundle', function () {
    return b.bundle()
        .pipe(source('main.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .on('error', gutil.log)
        .pipe(rename(path.basename(builtDistSource[0])))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('js/'));
});

gulp.task('build-typescript', function(callback) {
    runSequence('clean', 'typescript', callback);
});

gulp.task('build-bundle', ['build-typescript'], function(callback) {
    runSequence('bundle', function () {
        bw.close();
        finishBundling(callback);
    });
});

function finishBundling(callback) {
    var deleteGlobs = builtSource;
    deleteGlobs.push('js/**/*.map');
    deleteGlobs.push('js/*/**/', '!js/lib');
    deleteGlobs.push('!' + builtDistSource, '!' + builtDistSource + '.map');

    del(deleteGlobs, function (error) {
        if (error) {
            return callback(error);
        }

        gulp.src(builtDistSource)
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(rename(path.basename(distSource)))
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest('js/'))
            .on('finish', function () {
                var deleteGlobs = builtDistSource;
                deleteGlobs.push(builtDistSource + '.map');

                del(deleteGlobs, function (error) {
                    if (error) {
                        return callback(error);
                    }

                    if (callback !== undefined) {
                        callback();
                    }
                });
            });
    });
}

gulp.task('ts', ['typescript']);
gulp.task('build', ['build-bundle']);
gulp.task('default', ['watch']);
