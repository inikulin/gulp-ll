var spawn       = require('child_process').spawn;
var gulp        = require('gulp');
var PluginError = require('gulp-util').PluginError;
var Promise     = require('pinkie-promise');

function getTaskListFromArgs (args) {
    if (Array.isArray(args[0]))
        return args[0];

    return Array.prototype.slice.call(args);
}

function GulpLL () {
    this.taskFn = gulp.task.bind(gulp);

    this.llTasks          = [];
    this.llTasksDebugOnly = [];
    this.allTasks         = [];

    this.isDebug  = typeof v8debug !== 'undefined' || process.argv.indexOf('--ll-debug') > -1;
    this.isWorker = process.argv.indexOf('--ll-worker') > -1;

    this.args = process.argv.slice(1).filter(function (arg, idx) {
        // NOTE: remove debugger breakpoints from worker args
        return arg.indexOf('--debug-brk') < 0 && (idx !== 0 || arg !== 'debug');
    });

    if (process.argv.indexOf('--no-ll') < 0)
        this._overrideGulpTaskFn()
}


GulpLL.prototype._getWorkerArgs = function (task) {
    var ll = this;

    var args = this.args.filter(function (arg) {
        return ll.allTasks.indexOf(arg) < 0;
    });

    args.splice(1, 0, 'worker:' + task);
    args.push('--ll-worker');

    if (this.isDebug)
        args.push('--ll-debug');

    return args;
};

GulpLL.prototype._createWorker = function (task) {
    var worker = spawn(process.execPath, this._getWorkerArgs(task), { stdio: 'inherit' });

    return new Promise(function (resolve, reject) {
        worker.on('exit', function (code) {
            if (code === 0)
                resolve();
            else {
                reject(new PluginError('ll', {
                    message: 'Task ll:' + task + ' failed'
                }));
            }
        })
    });
};

GulpLL.prototype._isLLTask = function (task) {
    return this.llTasks.indexOf(task) > -1 || (this.isDebug && this.llTasksDebugOnly.indexOf(task) > -1);
};

GulpLL.prototype._overrideGulpTaskFn = function () {
    var ll = this;

    gulp.task = function (name, deps, fn) {
        if (!fn && typeof deps === 'function') {
            fn   = deps;
            deps = void 0;
        }

        if (ll._isLLTask(name)) {
            if (ll.isWorker) {
                // Also define a task under the original name so gulp's task validation will not complain
                ll.taskFn(name, function () {
                    throw new Error('Original task should not be executed in the worker');
                });
                deps = void 0;
                name = 'worker:' + name;
            }
            else {
                fn = function () {
                    return ll._createWorker(name);
                };
            }
        }


        ll.allTasks.push(name);
        if (deps) {
            ll.taskFn(name, deps, fn);
        } else {
            ll.taskFn(name, fn);
        }
    };
};

GulpLL.prototype.tasks = function () {
    this.llTasks = getTaskListFromArgs(arguments);
    return this;
};

GulpLL.prototype.onlyInDebug = function () {
    this.llTasksDebugOnly = getTaskListFromArgs(arguments);
    return this;
};


module.exports = new GulpLL();
