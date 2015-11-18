var ll   = require('../');
var gulp = require('gulp');

ll
    .tasks('default', 'task2', 'task3')
    .onlyInDebug('task4');

gulp.task('default', ['task2', 'task3', 'task4'], function () {
    console.log('%task1:' + process.pid + '%');
});


gulp.task('task2', ['task3'], function () {
    console.log('%task2:' + process.pid + '%');
});


gulp.task('task3', ['task5'], function () {
    console.log('%task3:' + process.pid + '%');
});


gulp.task('task4', function () {
    console.log('%task4:' + process.pid + '%');
});

gulp.task('task5', function () {
    console.log('%task5:' + process.pid + '%');
});
