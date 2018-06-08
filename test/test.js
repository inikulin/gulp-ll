var assert  = require('assert');
var exec    = require('child_process').exec;
var path    = require('path');
var Promise = require('pinkie-promise');

process.chdir('./test');

function getRunInfoFromStdout (stdout) {
    var re       = /%(.+?):(.+?)%/gm;
    var tasks    = [];
    var taskPids = [];

    for (var match = re.exec(stdout); match; match = re.exec(stdout)) {
        tasks.push(match[1]);
        taskPids.push(match[2]);
    }

    var processCount = taskPids
        .reduce(function (uniquePids, pid) {
            if (uniquePids.indexOf(pid) < 0)
                uniquePids.push(pid);

            return uniquePids;
        }, [])
        .length;

    return {
        tasks:        tasks.sort(),
        processCount: processCount
    }
}

function runGulp (param) {
    return new Promise(function (resolve, reject) {
        var cmd = [
            'gulp',
            param || ''
        ].join(' ');

        exec(cmd, function (err, stdout) {
            if (err)
                reject(new Error(stdout));
            else
                resolve(getRunInfoFromStdout(stdout));
        });
    });
}

var expectedTasks = ['task1', 'task2', 'task3', 'task4', 'task5'];

test('Should run tasks in parallel', function () {
    return runGulp()
        .then(function (runInfo) {
            assert.deepEqual(runInfo.tasks, expectedTasks);
            assert.strictEqual(runInfo.processCount, 3);
        });
});

test('Should not run tasks in parallel if --no-ll flag is specified', function () {
    return runGulp('--no-ll')
        .then(function (runInfo) {
            assert.deepEqual(runInfo.tasks, expectedTasks);
            assert.strictEqual(runInfo.processCount, 1);
        });
});

test("Regression - Gulp task is failed when it's run with the --dev argument (GH-1)", function () {
    // NOTE: smoke test, this should pass without error
    return runGulp('task3 --dev');
});

test('Regression - Gulp fails when a flag is specified without tasks (GH-5)', function () {
    // NOTE: smoke test, this should pass without error
    return runGulp('--dev');
});
