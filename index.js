var spawn       = require('child_process').spawn;
var gulp        = require('gulp');
var PluginError = require('gulp-util').PluginError;
var Promise     = require('pinkie-promise');

var isWorker = process.argv.indexOf('--ll-worker') > -1;
var disabled = process.argv.indexOf('--no-ll') > -1;

var args = process.argv.slice().filter(function (arg) {
    // NOTE: remove debugger breakpoints from worker args
    return arg.indexOf('--debug-brk') < 0;
});

var nodePath     = args.shift();
var tasks        = [];
var originalTask = gulp.task;

function getSpawnArgs (taskName) {
    var spawnArgs = args.filter(function (arg) {
        return tasks.indexOf(arg) < 0;
    });

    spawnArgs.push('ll:' + taskName);
    spawnArgs.push('--ll-worker');

    return spawnArgs;
}

function createLLTask (name) {
    return new Promise(function (resolve, reject) {
        var llTask = spawn(nodePath, getSpawnArgs(name), { stdio: 'inherit' });

        llTask.on('exit', function (code) {
            if (code === 0)
                resolve();
            else {
                reject(new PluginError('ll', {
                    message: 'Task ll:' + name + ' failed'
                }));
            }
        })
    });
}

gulp.task = function (name, deps, fn) {
    // NOTE: collect task names, so we
    // can filter them from worker args
    tasks.push(name);

    originalTask.call(gulp, name, deps, fn);
};

gulp.llTask = function (name, deps, fn) {
    if (!fn && typeof deps === 'function') {
        fn   = deps;
        deps = void 0;
    }

    if (disabled)
        gulp.task(name, deps, fn);

    else if (isWorker) {
        // NOTE: we should run without deps, since
        // they are already executed in the master
        gulp.task('ll:' + name, fn);
    }

    else {
        gulp.task(name, deps, function () {
            return createLLTask(name);
        });
    }
};