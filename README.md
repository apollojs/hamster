# Hamster.js

Hamster is a small (~1.6kB minified) independent script that will help you to
preserve error stack cross browsers, and also capture unexpected error that
leaked to window scope.

Hamster works with IE 8+, Chrome 20+, Firefox 3.6+, Safari 5+ and Opera 11.62+.

_Note: as IE 9-, Safari 5- don't support Error#stack, so the report is constructed
via arguments.callee.caller chain, and the report it's not that useful._

## Install

Install via bower

```sh
bower install hamster --save
```

## Usage

Include hamster.js into your `<head>` as the first script. But please not merge
it with other scripts, as it may not be executed if other script has error.

```html
<script type="text/javascript" src="scripts/hamster.js">
```

### Hamster.report()

Sends error report from an error instance.

```js
try {
  throw new Error();
} catch (e) {
  Hamster.report(e);
}
```

### Hamster.capture(fn)

Creates a wrapper function that will catch potential exception, and report it.

This is the recommended way to use Hamster.js, as it will capture as much data
as possible on old browsers.

```js
var fn = Hamster.capture(function() {
  throw new Error();
});
```

_Note: Hamster.capture() will wrap a function when error.stack is supported,
otherwise it will bypass exception and let window.onerror catch it, so that
line number and file name could possibly be preserved. Thus Hamster.capture()
can't guarantee the following statements will be executed._

### Hamster.onerror(err)

When a error report is issued, this method will be called, so capture it like:

```js
Hamster.onerror = function(report) {
  try {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/report', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
      // dom: dumpDom(document.documentElement),
      error: report
    }));
  } catch(e) {
    // simply can't fail here
  }
};
```

_Note: please wrap your code in a try catch, you don't want to propagate errors._

## Report

sample code used to generate error

```js
function maybeBroken(causeError) {
  if (causeError) throw new Error('Error caused');
  else goDeep(false);
}

function goDeep(causeError) {
  recurseSelf(1);
}

function recurseSelf(count) {
  if (count <= 0)
    recurseOnOther(1);
  else
    recurseSelf(count - 1);
}

function recurseOnOther(count) {
  if (count > 0)
    recurseBack(count);
  else
    maybeBroken(true);
}

function recurseBack(count) {
  if (count > 0)
    recurseOnOther(count - 1);
}

setTimeout(function() {
  Hamster.capture(maybeBroken)();
}, 0);

setTimeout(function() {
  maybeBroken();
}, 0);

try {
  eval('maybeBroken(false)');
} catch(e) {
  Hamster.report(e);
}
```

### caller report

This report is generate when using `Hamster.report()` on a browser without
Error#stack support.

```js
{ type: 'caller',
  message: 'Error caused',
  name: 'Error',
  stack: [ {} ],
  files: [] }
// Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.0; Trident/5.0)
```

### window report

This report is generate when using `Hamster.capture()` on a browser without
Error#stack support, you can get at least file name and line number.

```js
{ type: 'window',
  message: 'Error caused',
  stack: [ { f: 0, l: 16 } ],
  files: [ 'http://radiant-falls-1343.herokuapp.com/javascripts/error.js' ] }
// Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0; SLCC1; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729)
```

### Error#stack report

This report is generated on a browser with Error#stack support, this could be
captured via both `Hamster.capture()` and `Hamster.report(e)`, even
window.onerror could get a report like this (on later version of Firefox and Chrome.)

```js
{ type: 'error.stack',
  message: 'Error caused',
  name: 'Error',
  stack:
  [ { k: 'Error', raw: 'Error("Error caused")@:0', f: 0, l: 16 },
    { k: 'maybeBroken', f: 0, l: 16 },
    { k: 'recurseOnOther', f: 0, l: 35 },
    { k: 'recurseBack', f: 0, l: 40 },
    { k: 'recurseOnOther', f: 0, l: 33 },
    { k: 'recurseSelf', f: 0, l: 26 },
    { k: 'recurseSelf', f: 0, l: 28 },
    { k: 'goDeep', f: 0, l: 21 },
    { k: 'maybeBroken', f: 0, l: 17 },
    { k: '', f: 1, l: 40 },
    { k: '', f: 0, l: 44 } ],
  files:
  [ 'http://radiant-falls-1343.herokuapp.com/javascripts/error.js',
    'http://radiant-falls-1343.herokuapp.com/javascripts/hamster.js' ] }
// Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US; rv:1.9.2.17) Gecko/20110420 Firefox/3.6.17
// via Hamster.capture(e);

{ type: 'error.stack',
  message: 'Error caused',
  name: 'Error',
  stack:
  [ { raw: 'Error: Error caused' },
    { k: 'maybeBroken', f: 0, l: 16, c: 19 },
    { k: 'recurseOnOther', f: 0, l: 35, c: 5 },
    { k: 'recurseBack', f: 0, l: 40, c: 5 },
    { k: 'recurseOnOther', f: 0, l: 33, c: 5 },
    { k: 'recurseSelf', f: 0, l: 26, c: 5 },
    { k: 'recurseSelf', f: 0, l: 28, c: 5 },
    { k: 'goDeep', f: 0, l: 21, c: 3 },
    { k: 'maybeBroken', f: 0, l: 17, c: 8 },
    { k: 'eval code', raw: 'at eval code (eval code:1:1)' },
    { k: 'Global code', f: 0, l: 51, c: 3 } ],
  files: [ 'http://radiant-falls-1343.herokuapp.com/javascripts/error.js' ] }
// Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; WOW64; Trident/6.0)
// via Hamster.report(e);
```

## Best Practice

- Using `Hamster.capture()` over your global scope is prefered.

```js
Hamster.capture(function() {

// global closure

})();
```

- And always `throw new Error()`, instead of `new Error()`. As IE 10 won't capture
  call stack until you throw it. Please note that, IE will override Error#stack
  every time you throw it.

- When uglify/minify your code, set max line length to a value ~80 or less, as
  not every browser will tell you which column to look at, this will help you
  to locate function faster.
