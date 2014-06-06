# Hamster.js

Hamster is a small independent script that will help you to preserve error stack
cross browsers, and also capture unexpected error that leaked to window scope.

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

Hamster will extend Function and Error prototypes:

### Errro#report()

Sends error report from an error instance.

```js
Error.prototype.report();

// try {
//   throw new Error();
// } catch(e) {
//   e.report();
// }
```

### Function#reportError()

Creates a wrapper function that will catch potential exception, and report it.

```js
Function.prototype.reportError();

// var fn = (function() {}).reportError();
```

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

try {
  maybeBroken(false);
} catch(e) {
  e.report();
}

try {
  eval('maybeBroken(false)');
} catch(e) {
  e.report();
}

maybeBroken(false);

```

### caller report

```js
{
  "type": "caller",
  "message": "Error caused",
  "name": "Error",
  "stack": [
    {}
  ],
  "files": []
}
// Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.0; Trident/5.0)
```

### window report

```js
{
  "type": "window",
  "message": "Error caused",
  "stack": [
    {
      "f": 0,
      "l": 6
    }
  ],
  "files": [
    "http://radiant-falls-1343.herokuapp.com/javascripts/error.js"
  ]
}
// Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.0; Trident/5.0)
```

### Error#stack report

```js
{
  "type": "error.stack",
  "message": "Error caused",
  "name": "Error",
  "stack": [
    {
      "k": "Error",
      "raw": "Error(\"Error caused\")@:0",
      "f": 0,
      "l": 6
    },
    {
      "k": "maybeBroken",
      "f": 0,
      "l": 6
    },
    {
      "k": "recurseOnOther",
      "f": 0,
      "l": 25
    },
    {
      "k": "recurseBack",
      "f": 0,
      "l": 30
    },
    {
      "k": "recurseOnOther",
      "f": 0,
      "l": 23
    },
    {
      "k": "recurseSelf",
      "f": 0,
      "l": 16
    },
    {
      "k": "recurseSelf",
      "f": 0,
      "l": 18
    },
    {
      "k": "goDeep",
      "f": 0,
      "l": 11
    },
    {
      "k": "maybeBroken",
      "f": 0,
      "l": 7
    },
    {
      "k": "",
      "f": 0,
      "l": 34
    }
  ],
  "files": [
    "http://radiant-falls-1343.herokuapp.com/javascripts/error.js"
  ]
}
// Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US; rv:1.9.2.17) Gecko/20110420 Firefox/3.6.17

{
  "type": "error.stack",
  "message": "Error caused",
  "name": "Error",
  "stack": [
    {
      "raw": "Error: Error caused"
    },
    {
      "k": "maybeBroken",
      "f": 0,
      "l": 6,
      "c": 21
    },
    {
      "k": "recurseOnOther",
      "f": 0,
      "l": 25,
      "c": 9
    },
    {
      "k": "recurseBack",
      "f": 0,
      "l": 30,
      "c": 9
    },
    {
      "k": "recurseOnOther",
      "f": 0,
      "l": 23,
      "c": 9
    },
    {
      "k": "recurseSelf",
      "f": 0,
      "l": 16,
      "c": 9
    },
    {
      "k": "recurseSelf",
      "f": 0,
      "l": 18,
      "c": 9
    },
    {
      "k": "goDeep",
      "f": 0,
      "l": 11,
      "c": 5
    },
    {
      "k": "maybeBroken",
      "f": 0,
      "l": 7,
      "c": 10
    },
    {
      "k": "Global code",
      "f": 0,
      "l": 34,
      "c": 5
    }
  ],
  "files": [
    "http://radiant-falls-1343.herokuapp.com/javascripts/error.js"
  ]
}
// Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; WOW64; Trident/6.0)
```
