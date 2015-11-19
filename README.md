<p align="center">
    <a href="http://inikulin.github.io/gulp-ll">
        <img src="https://raw.github.com/inikulin/gulp-ll/master/logo.png" alt="gulp-ll" />
    </a>
</p>

<p align="center">
<strike><i>Ugly workaround for this imperfect world where we don't have threads in Node.</i></strike>
</p>
<p align="center">
<i><b>Run CPU-consuming Gulp tasks in the separate processes to achieve faster builds.</b></i>
</p>

<p align="center">
  <a href="https://travis-ci.org/inikulin/gulp-ll"><img alt="Build Status" src="https://api.travis-ci.org/inikulin/gulp-ll.svg"></a>
  <a href="https://www.npmjs.com/package/gulp-ll"><img alt="NPM Version" src="https://img.shields.io/npm/v/gulp-ll.svg"></a>
</p>

## Install
```
npm install gulp-ll
```

## Usage
Declare which tasks should be run in parallel **before** any task declaration:

```js
var gulp = require('gulp');
var ll   = require('gulp-ll');

ll.tasks(['lint', 'compile-scripts']);

gulp.task('lint', () => {
// Task code...
});

gulp.task('compile-scripts', () => {
// Task code...
});
```

And we're set :tada:

## So, now my builds will run faster, right?
It depends. Node processes are quite slow to spawn. So, running tasks in the separate processes could be
slower than executing them sequentially in the single process. You need to play a little bit with the
configuration (using `time gulp your-task`) to figure out the optimal one. E.g. I was able to reach maximum
performance (approx. 30% faster) by using *gulp-ll* only for the the heaviest CPU-consuming task out of 3 in my project.
Performance gain also depends on the codebase size: obviously, it will give better results in the big projects.

## Faster debugging sessions
Node process may become painfully slow in the debugging mode. Sometimes, when you trying to debug your tests by
running `test` task that depends on scripts compilation, linting, etc. it may take ages to reach the desired breakpoint.
This is there *gulp-ll* come in handy - it will run heavy gulp tasks in the separate processes with the regular speed.
Taking in consideration what was told in the previous paragraph, more likely you will not want to run all your heavy
tasks in the separate processes. But, you can force them to to do so only in the debug:
```js
ll
    // Always run in separate process
    .tasks('lint');
    // Run in separate process only in debug
    .onlyInDebug('compile-scripts', 'build-templates');
```

## How I can debug task if it's in separate process?
You can just disable *gulp-ll* by running Gulp with `--no-ll` parameter:
```
gulp my-task --no-ll
```

## Caveats
More likely *gulp-ll* will not work for you if you have global variables set by one task and used by another.
Apart from the topic, I suggest you to never do so.

## Author
[Ivan Nikulin](https://github.com/inikulin) (ifaaan@gmail.com)
