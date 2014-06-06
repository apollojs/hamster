(function() {
Error.stackTraceLimit = 10;
var kSupportErrorStack;
try {
  throw new Error();
} catch(e) {
  kSupportErrorStack = e.stack !== undefined;
}
window.Hamster = {
  onerror: function() {},
  report: report,
  capture: kSupportErrorStack ? capture : noCapture
};
window.onerror = function(message, url, line, column, err) {
  if (err) {
    report(err);
  } else {
    // this is a unhandled error,
    // only last stack level could be retrieved
    generateReport('window', {
      message: message,
      fileName: url,
      lineNumber: line,
      columnNumber: column
    }, []);
  }
};
function report(e) {
  if (e.stack) {
    generateReport('error.stack', e, normalizeStack(e.stack));
  } else {
    // populate error let window.onerror to handle,
    // thus we can get line no.
    generateReport('caller', e, constructStack());
  }
}
function capture(fn) {
  return function() {
    try {
      return fn.apply(this, arguments);
    } catch(e) {
      report(e);
    };
  };
}
function noCapture(fn) {
  return fn;
}
function generateReport(type, err, stack) {
  var report = {
    type: type,
    message: err.message || err.description,
    name: err.name,
    code: err.code || err.number,
    stack: stack
  };
  if (!stack[0])
    stack.push({});
  var lastCall = stack[0];
  if (!lastCall.f)
    lastCall.f = err.fileName;
  if (!lastCall.l)
    lastCall.l = err.lineNumber;
  if (!lastCall.c)
    lastCall.c = err.columnNumber;
  var files = [];
  for (var i = 0; i < stack.length; i++) {
    var stackCall = stack[i];
    if (stackCall.f) {
      var fileIndex = indexOf(files, stackCall.f);
      if (fileIndex == -1)
        fileIndex = files.push(stackCall.f) - 1;
      stackCall.f = fileIndex;
    }
  }
  report.files = files;
  Hamster.onerror(report);
}
var kFnNamePattern = /^(?:at ([\w. ]*)(?= \()|([\w. ]*)(?:\(.*\))?@)/;
var kUrlPattern = /(http.+?):(\d+)(?::(\d+))?(?=\)|$)/;
function normalizeStack(st) {
  var stack = [];
  st = st.split(/\n/);
  for (var i = 0; i < st.length; i++) {
    var raw = trim(st[i]);
    if (raw) {
      var lastCall = {};
      var token = kFnNamePattern.exec(raw);
      if (token)
        lastCall.k = token[1] || token[2];
      var url = kUrlPattern.exec(raw);
      if (url) {
        lastCall.f = url[1];
        if (url[2])
          lastCall.l = +url[2];
        if (url[3])
          lastCall.c = +url[3];
      } else {
        lastCall.raw = raw;
      }
      stack.push(lastCall);
    }
  }
  return stack;
}
function constructStack() {
  var stack = [];
  var fn = constructStack;
  while ((fn = fn.caller) && stack.length < 10) {
    if (fn == report)
      continue;
    stack.push({
      fn: fn.toString(),
      args: slice(fn.arguments)
    });
  }
  return stack;
}
function slice(arr) {
  return Array.prototype.slice.apply(arr);
}
// IE compatible
function trim(str) {
  return str.replace(/(^\s+|\s+$)/g, '')
}
// IE8 compatible
function indexOf(arr, val) {
  for (var i = 0; i < arr.length; i++)
    if (arr[i] == val)
      return i;
  return -1;
}
})();
