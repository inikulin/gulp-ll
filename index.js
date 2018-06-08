var spawn       = require('child_process').spawn;
var gulp        = require('gulp');
var PluginError = require('plugin-error');
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


GulpLL.prototype._getWorkerTaskName = function (taskName) {
    return 'worker:' + taskName;
};

GulpLL.prototype._getWorkerArgs = function (task) {
    var ll = this;

    var args = this.args.filter(function (arg) {
        return ll.allTasks.indexOf(arg) < 0;
    });

    args.splice(1, 0, ll._getWorkerTaskName(task));

    if (!this.isWorker) {
        args.push('--ll-worker');
        args.push('--steps-as-tasks');

        if (this.isDebug)
            args.push('--ll-debug');
    }

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

GulpLL.prototype._getNameAndFn = function (gulpTaskArgs) {
    const isNameExplicit = typeof gulpTaskArgs[0] === 'string';

    return {
        name: isNameExplicit ? gulpTaskArgs[0] : (gulpTaskArgs[0].name || gulpTaskArgs[0].displayName),
        fn:   isNameExplicit ? gulpTaskArgs[1] : gulpTaskArgs[0],

        isNameExplicit
    };
};

GulpLL.prototype._getGulpTaskArgs = function (name, fn, { isNameExplicit }) {
    let gulpTaskArgs = [];

    if (isNameExplicit)
        gulpTaskArgs.push(name, fn);
    else {
        fn.displayName = name;

        gulpTaskArgs.push(fn);
    }

    return gulpTaskArgs;
};

GulpLL.prototype._addTaskToGulp = function (name, fn, { isNameExplicit }) {
    const ll = this;

    ll.allTasks.push(name);
    ll.taskFn(...ll._getGulpTaskArgs(name, fn, { isNameExplicit }));
};

GulpLL.prototype._overrideGulpTaskFn = function () {
    var ll = this;

    gulp.task = function (...args) {
        let { name, fn, isNameExplicit } = ll._getNameAndFn(args);

        if (ll._isLLTask(name)) {
            const workerTaskName = ll._getWorkerTaskName(name);

            if (ll.isWorker && ll.args.indexOf(workerTaskName) > -1)
                ll._addTaskToGulp(workerTaskName, fn, { isNameExplicit });
            else {
                fn = function () {
                    return ll._createWorker(name);
                };
            }
        }

        ll._addTaskToGulp(name, fn, { isNameExplicit });
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
