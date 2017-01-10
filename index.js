'use strict';

exports.parse = function (source) {
  var pointers = {};
  var line = 0;
  var column = 0;
  var pos = 0;
  var data = _parse('');
  return { data: data, pointers: pointers };

  function _parse(ptr) {
    whitespace();
    var data;
    map(ptr, 'value');
    switch (source[pos]) {
      case 't': read('true'); data = true; break;
      case 'f': read('false'); data = false; break;
      case 'n': read('null'); data = null; break;
      case '"': data = parseString(); break;
      case '[': data = parseArray(); break;
      case '{': data = parseObject(); break;
      default:
        if ('-0123456789'.indexOf(source[pos]) >= 0)
          data = parseNumber();
        else
          unexpectedToken();
    }
    map(ptr, 'valueEnd');
    whitespace();
    if (pos < source.length) unexpectedToken();
    return data;
  }

  function whitespace() {
    // TODO scan whitespace
  }

  function parseString() {
    getChar();
    var str = '';
    var char;
    while (true) {
      char = getChar();
      if (char == '"') {
        break;
      } else if (char == '\\') {
        char = getChar();
        if (char in escapedChars)
          str += escapedChars[char];
        else if (char == 'u')
          str += getCharCode();
        else
          wasUnexpectedToken();          
      } else {
        str += char;
      }
    }
    return str;
  }

  function parseNumber() {
    var numStr = '';
    if (source[pos] == '-') numStr += getChar();

    numStr += source[pos] == '0'
              ? getChar()
              : getDigits();

    if (source[pos] == '.')
      numStr += getChar() + getDigits();

    if (source[pos] == 'e' || source[pos] == 'E') {
      numStr += getChar();
      if (source[pos] == '+' || source[pos] == '-') numStr += getChar();
      numStr += getDigits();
    }

    return +numStr;
  }

  function parseArray() {

  }

  function parseObject() {

  }

  function read(str) {
    var i = 0;
    while (i < str.length && (checkUnexpectedEnd() || source[pos] === str[i])) {
      i++;
      pos++;
      column++;
    }
    if (i < str.length) unexpectedToken();
  }

  function getChar() {
    checkUnexpectedEnd();
    var char = source[pos];
    pos++;
    column++; // new line?
    return char;
  }

  function getCharCode() {
    // TODO
    var count = 4;
    var code = 0;
    while (count--) {
      code <<= 4;
      checkUnexpectedEnd();
      var char = source[pos].toLowerCase();
      if (char >= 'a' && char <= 'f')
        code += char.charCodeAt() - 'a'.charCodeAt() + 10;
      else if (char >= '0' && char <= '9')
        code += +char;
      else
        unexpectedToken();

      pos++;
      column++;
    }
    return String.fromCharCode(code);
  }

  function getDigits() {
    var digits = '';
    while (source[pos] >= '0' && source[pos] <= '9')
      digits += getChar();

    if (digits.length) return digits;
    checkUnexpectedEnd();
    unexpectedToken();
  }

  function map(ptr, prop) {
    pointers[ptr] = pointers[ptr] || {};
    pointers[ptr][prop] = {
      line: line,
      column: column,
      pos: pos
    };
  }

  function unexpectedToken() {
    throw new SyntaxError('Unexpected token ' + source[pos] + ' in JSON at position ' + pos);
  }

  function wasUnexpectedToken() {
    pos--;
    column--;
    unexpectedToken();
  }

  function checkUnexpectedEnd() {
    if (pos >= source.length)
      throw new SyntaxError('Unexpected end of JSON input');
  }
};

var escapedChars = {
  'b': '\b',
  'f': '\f',
  'n': '\n',
  'r': '\r',
  't': '\t',
  '"': '"',
  '/': '/',
  '\\': '\\'
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
        if (data === null)
          out('null');
        else if (typeof data.toJSON == 'function')
          out(quoted(data.toJSON()));
        else if (Array.isArray(data))
          stringifyArray();
        else
          stringifyObject();
    }
    map(ptr, 'valueEnd');

    function stringifyArray() {
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
    }

    function stringifyObject() {
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
