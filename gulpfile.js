// process.env.BROWSERIFYSHIM_DIAGNOSTICS=1

/* eslint-disable */
var gulp = require('gulp')
var concat = require('gulp-concat')
var cleanCss = require('gulp-clean-css')
var sourcemaps = require('gulp-sourcemaps')
var uglify = require('gulp-uglify')
var browserify = require('browserify')
var vinylSource = require('vinyl-source-stream')
var vinylBuffer = require('vinyl-buffer')
var environments = require('gulp-environments')
var browserSync = require('browser-sync')
var exec = require('child_process').exec

/**
 * ENVIRONMENTS
 */

const development = environments.development;
const production = environments.production;

// Configuration
var flask_assets_folder = "core/static";
var bundles = {
    core: {
        css: {
            src: [
                "src/css/bootstrap-theme.min.css",
                "src/css/main.css",
                "src/css/main.responsive.css",
                "src/css/main.quickfix.css",
                "src/css/layout.main.css",
                "src/css/layout.forms.css",
                "node_modules/font-awesome/css/font-awesome.min.css"
            ],
            dist: {
                path: flask_assets_folder + "/css/",
                file: "bundle.core.css"
            }
        },
        js: {
            src: ["src/js/core.js", "src/js/utils.js"],
            dist: {
                path: flask_assets_folder + "/js/",
                file: "bundle.core.js"
            }
        }
    },
    fishfrytable: {
        css: {
            src: [
                "node_modules/leaflet/dist/leaflet.css",
                // 'src/css/datatables.min.css'
                "node_modules/datatables.net-bs/css/dataTables.bootstrap.css",
                "node_modules/datatables.net-select-bs/css/select.bootstrap.min.css",
                "node_modules/datatables.net-buttons-bs/css/buttons.bootstrap.min.css",
                "node_modules/datatables.net-fixedheader-bs/css/fixedHeader.bootstrap.min.css"
                // 'node_modules/datatables.net-responsive-bs/css/responsive.bootstrap.min.css'
            ],
            dist: {
                path: flask_assets_folder + "/css/",
                file: "bundle.fishfrytable.css"
            }
        },
        js: {
            src: [
                // 'src/js/datatables.min.js',
                "src/js/datatable.js"
            ],
            dist: {
                path: flask_assets_folder + "/js/",
                file: "bundle.fishfrytable.js"
            }
        }
    },
    fishfryform: {
        css: {
            src: [
                "node_modules/leaflet/dist/leaflet.css",
                "node_modules/pc-bootstrap4-datetimepicker/build/css/bootstrap-datetimepicker.min.css"
            ],
            dist: {
                path: flask_assets_folder + "/css/",
                file: "bundle.fishfryform.css"
            }
        },
        js: {
            src: ["src/js/fishfryform.js"],
            dist: {
                path: flask_assets_folder + "/js/",
                file: "bundle.fishfryform.js"
            }
        }
    },
    leaderboard: {
        css: {
            src: [
                "src/css/bootstrap-theme.min.css",
                "src/css/main.css",
                "src/css/main.responsive.css",
                "src/css/main.quickfix.css",
                "src/css/layout.main.css",
                "src/css/layout.forms.css",
                "node_modules/font-awesome/css/font-awesome.min.css"
            ],
            dist: {
                path: flask_assets_folder + "/css/",
                file: "bundle.core.css"
            }
        },
        js: {
            src: [
                "src/js/leaderboard.js"
            ],
            dist: {
                path: flask_assets_folder + "/js/",
                file: "bundle.leaderboard.js"
            }
        }
    }
};

var bundlingConfigs = Object.keys(bundles);

/**
 * BUNDLE JS
 */
bundlingConfigs.forEach(function (bundleName) {
    gulp.task("scripts:" + bundleName, function () {
        return (
            browserify({
                basedir: ".",
                debug: true,
                entries: bundles[bundleName].js.src
            })
                .transform('babelify', {
                    presets: ['@babel/preset-env'],
                    sourceMaps: true,
                    global: true,
                    // ignore: ['/node_modules/'],
                    "plugins": ["transform-remove-strict-mode"]
                })
                .bundle()
                .pipe(vinylSource(bundles[bundleName].js.dist.file))
                .pipe(vinylBuffer())
                .pipe(development(sourcemaps.init({ loadMaps: true })))
                .pipe(production(uglify()))
                .pipe(development(sourcemaps.write("./")))
                .pipe(gulp.dest(bundles[bundleName].js.dist.path))
                .pipe(
                    browserSync.reload({
                        stream: true
                    })
                )
        );
    });
});

gulp.task(
    "pack-js",
    gulp.parallel(
        bundlingConfigs.map(function (name) {
            return "scripts:" + name;
        })
    )
);

/**
 * BUNDLE CSS
 */
bundlingConfigs.forEach(function (bundleName) {
    gulp.task("styles:" + bundleName, function () {
        return gulp
            .src(bundles[bundleName].css.src)
            .pipe(concat(bundles[bundleName].css.dist.file))
            .pipe(production(cleanCss()))
            .pipe(gulp.dest(bundles[bundleName].css.dist.path))
            .pipe(
                browserSync.reload({
                    stream: true
                })
            );
    });
});

gulp.task(
    "pack-css",
    gulp.parallel(
        bundlingConfigs.map(function (name) {
            return "styles:" + name;
        })
    )
);

/**
 * Copy leaflet assets to Flask assets folder
 */
gulp.task("leaflet-assets", function () {
    return gulp
        .src("node_modules/leaflet/dist/images/**/*")
        .pipe(gulp.dest(flask_assets_folder + "/images"))
        .pipe(
            browserSync.reload({
                stream: true
            })
        );
});

/**
 * COMBINED TASKS
 */

// basic build task.
gulp.task("build", gulp.parallel("pack-js", "pack-css", "leaflet-assets"));

//Run Flask server
gulp.task("runserver", function () {
    var proc = exec("pipenv run python application.py");
});
gulp.task("browser-sync", function () {
    browserSync({
        notify: true,
        proxy: "localhost:5000"
    });
});

gulp.task("serve-and-sync", gulp.parallel("runserver", "browser-sync"));

// gulp watch task
gulp.task(
    "watch",
    // start browserSync, and run the rest of our tasks once
    gulp.parallel(
        "serve-and-sync",
        "pack-css",
        "pack-js",
        "leaflet-assets",
        // re-run these tasks if source directories change
        function () {
            gulp.watch("src/css/*.css", gulp.parallel("pack-css"));
            gulp.watch("src/js/*.js", gulp.parallel("pack-js"));
        }
    )
);

// default (parameter-less) gulp task, runs watch and browser-sync
gulp.task("default", gulp.parallel("build"));