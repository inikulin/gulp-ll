var ll   = require('../');
var gulp = require('gulp');

ll
    .tasks('default', 'task2', 'task3')
    .onlyInDebug('task4');

gulp.task('task5', function (done) {
    console.log('%task5:' + process.pid + '%');
    done();
});

gulp.task('task3', gulp.series('task5', function (done) {
    console.log('%task3:' + process.pid + '%');
    done();
}));

gulp.task('task2', gulp.series('task3', function (done) {
    console.log('%task2:' + process.pid + '%');
    done();
}));

gulp.task('task4', function (done) {
    console.log('%task4:' + process.pid + '%');
    done();
});

gulp.task('default', gulp.series(gulp.parallel('task2', 'task4'), function (done) {
    console.log('%task1:' + process.pid + '%');
    done();
}));
