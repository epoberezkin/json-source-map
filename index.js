'use strict';

exports.parse = function () {
  throw new Error('Not implemented');
};

exports.stringify = function (data, _, whitespace) {
  if (!validType(data)) return;
  switch (typeof whitespace) {
    case 'number':
      var wsLen = whitespace > 10
                  ? 10
                  : whitespace < 0
                    ? 0
                    : Math.floor(whitespace);
      whitespace = wsLen && repeat(wsLen, ' ');
      break;
    case 'string':
      whitespace = whitespace.slice(0, 10);
      break;
    default:
      whitespace = undefined;
  }

  var json = '';
  var pointers = {};
  var line = 0;
  var column = 0;
  var pos = 0;
  _stringify(data, 0, '');
  return { json: json, pointers: pointers };

  function _stringify(data, lvl, ptr) {
    map(ptr, 'value');
    switch (typeof data) {
      case 'number':
      case 'boolean':
        out('' + data); break;
      case 'string':
        out(quoted(data)); break;
      case 'object':
        if (Array.isArray(data)) {
          if (data.length) {
            out('[');
            var itemLvl = lvl + 1;
            for (var i=0; i<data.length; i++) {
              if (i) out(',');
              indent(itemLvl);
              var item = validType(data[i]) ? data[i] : null;
              var itemPtr = ptr + '/' + i;
              _stringify(item, itemLvl, itemPtr);
            }
            indent(lvl);
            out(']');
          } else {
            out('[]');
          }
        } else if (data === null) {
          out('null');
        } else if (data instanceof Date) {
          out(quoted(data.toJSON()));
        } else {
          var keys = Object.keys(data);
          if (keys.length) {
            out('{');
            var propLvl = lvl + 1;
            for (var i=0; i<keys.length; i++) {
              var key = keys[i];
              var value = data[key];
              if (validType(value)) {
                if (i) out(',');
                var propPtr = ptr + '/' + escapeJsonPointer(key);
                indent(propLvl);
                map(propPtr, 'key');
                out(quoted(key));
                map(propPtr, 'keyEnd');
                out(':')
                if (whitespace) out(' ');
                _stringify(value, propLvl, propPtr);
              }
            }
            indent(lvl);
            out('}');
          } else {
            out('{}');
          }
        }
    }
    map(ptr, 'valueEnd');
  }

  function out(str) {
    column += str.length;
    pos += str.length;
    json += str;
  }

  function indent(lvl) {
    if (whitespace) {
      line++;
      var wsLen = lvl * whitespace.length;
      column = wsLen;
      pos += wsLen + 1;
      json += '\n' + repeat(lvl, whitespace);
    }
  }

  function map(ptr, prop) {
    pointers[ptr] = pointers[ptr] || {};
    pointers[ptr][prop] = {
      line: line,
      column: column,
      pos: pos
    };
  }

  function repeat(n, str) {
    return Array(n + 1).join(str);
  }
};


var VALID_TYPES = ['number', 'boolean', 'string', 'object'];
function validType(data) {
  return VALID_TYPES.indexOf(typeof data) >= 0;
}


var ESC_QUOTE = /"|\\/g;
var ESC_B = /[\b]/g;
var ESC_F = /\f/g;
var ESC_N = /\n/g;
var ESC_R = /\r/g;
var ESC_T = /\t/g;
function quoted(str) {
  str = str.replace(ESC_QUOTE, '\\$&')
           .replace(ESC_F, '\\f')
           .replace(ESC_B, '\\b')
           .replace(ESC_N, '\\n')
           .replace(ESC_R, '\\r')
           .replace(ESC_T, '\\t');
  return '"' + str + '"';
}


var ESC_0 = /~/g;
var ESC_1 = /\//g;
function escapeJsonPointer(str) {
  return str.replace(ESC_0, '~0')
            .replace(ESC_1, '~1');
}
