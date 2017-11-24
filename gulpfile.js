var browserify = require( 'browserify' );
var source = require( 'vinyl-source-stream' );
var buffer = require( 'vinyl-buffer' );
var pkg = require( './package.json' );

var gulp = require( 'gulp' );
var clone = require( 'gulp-clone' );
var derequire = require( 'gulp-derequire' );
var header = require( 'gulp-header' );
var rename = require( 'gulp-rename' );
var gutil = require( 'gulp-util' );
var uglify = require( 'gulp-uglify' );
var sourcemaps = require( 'gulp-sourcemaps' );

var mocha = require( 'gulp-mocha' );
var mochaPhantomJS = require( 'gulp-mocha-phantomjs' );
var prompt = require( 'gulp-prompt' );

require( 'babel-core/register' );

var banner = [
    '/**',
    ' * plate.js <%= context.version %>',
    ' * by sydneyzh <%= context.date %>',
    ' */',
    ''
].join( '\n' );

// ========== bundle ==========

var bundler = browserify( 'src/plate', {

    standalone: 'PLATE',
    debug: true

} );

function bundle( isProduction, opts ) {

    if ( ! isProduction ) {

        return bundler
            .bundle()
            .on( 'error', gutil.log )
            .pipe( source( 'compiled' ) )
            .pipe( derequire() )
            .pipe( buffer() )
            .pipe( sourcemaps.init( { loadMaps: true } ) )
            .pipe( sourcemaps.write( './maps' ) )
            .pipe( rename( 'plate.dev.js' ) )
            .pipe( header( banner + '\n', { context: opts } ) )
            .pipe( gulp.dest( 'build' ) );

    } else {

        bundler
            .transform( 'babelify' )
            .bundle()
            .on( 'error', gutil.log )
            .pipe( source( 'plate.min.js' ) )
            .pipe( derequire() )
            .pipe( buffer() )
            .pipe( uglify() )
            .on( 'error', gutil.log )
            .pipe( header( banner + '\n', { context: opts } ) )
            .pipe( gulp.dest( 'build' ) );

        return null;

    }

}

// ========== tasks ==========

var headerInfo = {

    version: pkg.version,
    date: new Date().toISOString().slice( 0, 10 )

};

gulp.task( 'dev:bundle', function( done ) {

    bundle( false, headerInfo );
    done();

} );

gulp.task( 'deploy:bundle', function( done ) {

    bundle( true, headerInfo );
    done();

} );

// test

function runTest() {

    return gulp.src( [ 'test/node/*.js' ], { read: false } )
        .pipe( mocha( { reporter: 'nyan' } ) );

}

gulp.task( 'test', function( done ) {

    runTest();
    done();

} );

gulp.task( 'dev:test', function( done ) {

    gulp.watch( 'build/**', 'test/node/**', runTest );
    done();

} );

gulp.task( 'default', gulp.series( 'deploy:bundle' ) );
