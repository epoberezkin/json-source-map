'use strict';

var jsonMap = require('.');
var assert = require('assert');
var jsonPointer = require('json-pointer')


describe('parse', () => {
  it('should parse JSON string and generate mappings');
});


describe('stringify', () => {
  it('should stringify data and generate mappings', () => {
    var data = {
      "foo": [
        {
          "bar": 1
        },
        {
          "baz": 2
        }
      ]
    };

    var { json, pointers } = jsonMap.stringify(data, null, 2);

    testResult(json, pointers, data);
    assert.deepEqual(pointers, {
      '': {
        value: { line: 0, column: 0, pos: 0 },
        valueEnd: { line: 9, column: 1, pos: 73 }
      },
      '/foo': {
        key: { line: 1, column: 2, pos: 4 },
        keyEnd: { line: 1, column: 7, pos: 9 },
        value: { line: 1, column: 9, pos: 11 },
        valueEnd: { line: 8, column: 3, pos: 71 }
      },
      '/foo/0': {
        value: { line: 2, column: 4, pos: 17 },
        valueEnd: { line: 4, column: 5, pos: 39 }
      },
      '/foo/0/bar': {
        key: { line: 3, column: 6, pos: 25 },
        keyEnd: { line: 3, column: 11, pos: 30 },
        value: { line: 3, column: 13, pos: 32 },
        valueEnd: { line: 3, column: 14, pos: 33 }
      },
      '/foo/1': {
        value: { line: 5, column: 4, pos: 45 },
        valueEnd: { line: 7, column: 5, pos: 67 }
      },
      '/foo/1/baz': {
        key: { line: 6, column: 6, pos: 53 },
        keyEnd: { line: 6, column: 11, pos: 58 },
        value: { line: 6, column: 13, pos: 60 },
        valueEnd: { line: 6, column: 14, pos: 61 }
      }
    });
  });

  it('should stringify string, null, empty array, empty object, Date', () => {
    var data = {
      str: 'foo',
      null: null,
      arr: [],
      obj: {},
      date: new Date('2017-01-09T08:50:13.064Z'),
      custom: {
        toJSON: () => 'custom'
      },
      control: '"\f\b\n\r\t"',
      'esc/aped~': true
    }

    var { json, pointers } = jsonMap.stringify(data, null, '  ');

    data.date = '2017-01-09T08:50:13.064Z';
    data.custom = 'custom';
    testResult(json, pointers, data);
    assert.deepEqual(pointers, {
      '': {
        value: { line: 0, column: 0, pos: 0 },
        valueEnd: { line: 9, column: 1, pos: 172 }
      },
      '/str': {
        key: { line: 1, column: 2, pos: 4 },
        keyEnd: { line: 1, column: 7, pos: 9 },
        value: { line: 1, column: 9, pos: 11 },
        valueEnd: { line: 1, column: 14, pos: 16 }
      },
      '/null': {
        key: { line: 2, column: 2, pos: 20 },
        keyEnd: { line: 2, column: 8, pos: 26 },
        value: { line: 2, column: 10, pos: 28 },
        valueEnd: { line: 2, column: 14, pos: 32 }
      },
      '/arr': {
        key: { line: 3, column: 2, pos: 36 },
        keyEnd: { line: 3, column: 7, pos: 41 },
        value: { line: 3, column: 9, pos: 43 },
        valueEnd: { line: 3, column: 11, pos: 45 }
      },
      '/obj': {
        key: { line: 4, column: 2, pos: 49 },
        keyEnd: { line: 4, column: 7, pos: 54 },
        value: { line: 4, column: 9, pos: 56 },
        valueEnd: { line: 4, column: 11, pos: 58 }
      },
      '/date': {
        key: { line: 5, column: 2, pos: 62 },
        keyEnd: { line: 5, column: 8, pos: 68 },
        value: { line: 5, column: 10, pos: 70 },
        valueEnd: { line: 5, column: 36, pos: 96 }
      },
      '/custom': {
        key: { line: 6, column: 2, pos: 100 },
        keyEnd: { line: 6, column: 10, pos: 108 },
        value: { line: 6, column: 12, pos: 110 },
        valueEnd: { line: 6, column: 20, pos: 118 }
      },
      '/control': {
        key: { column: 2, line: 7, pos: 122 },
        keyEnd: { column: 11, line: 7, pos: 131 },
        value: { column: 13, line: 7, pos: 133 },
        valueEnd: { column: 29, line: 7, pos: 149 }
      },
      '/esc~1aped~0': {
        key: { line: 8, column: 2, pos: 153 },
        keyEnd: { line: 8, column: 13, pos: 164 },
        value: { line: 8, column: 15, pos: 166 },
        valueEnd: { line: 8, column: 19, pos: 170 }
      }
    });
  });


  function testResult(json, pointers, data) {
    assert.deepStrictEqual(JSON.parse(json), data);
    for (var ptr in pointers) {
      var map = pointers[ptr];
      if (map.key !== undefined) {
        assert.strictEqual(
          JSON.parse(json.slice(map.key.pos, map.keyEnd.pos)),
          jsonPointer.parse(ptr).slice(-1)[0] // key
        );
      }
      assert.deepStrictEqual(
        JSON.parse(json.slice(map.value.pos, map.valueEnd.pos)),
        jsonPointer.get(data, ptr) // value
      );
    }
  }
});
