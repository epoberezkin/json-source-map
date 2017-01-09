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
        }
      ]
    };

    var { json, pointers } = jsonMap.stringify(data, null, 2);
    assert.deepStrictEqual(JSON.parse(json), data);
    for (var ptr in pointers) {
      var map = pointers[ptr];
      if (map.key !== undefined) {
        assert.equal(
          JSON.parse(json.slice(map.key.pos, map.keyEnd.pos)),
          jsonPointer.parse(ptr).slice(-1) // key
        );
      }
      assert.deepStrictEqual(
        JSON.parse(json.slice(map.value.pos, map.valueEnd.pos)),
        jsonPointer.get(data, ptr) // value
      );
    }

    assert.deepEqual(pointers, {
      '': {
        value: { line: 0, column: 0, pos: 0 },
        valueEnd: { line: 6, column: 1, pos: 45 }
      },
      '/foo': {
        key: { line: 1, column: 2, pos: 4 },
        keyEnd: { line: 1, column: 7, pos: 9 },
        value: { line: 1, column: 9, pos: 11 },
        valueEnd: { line: 5, column: 3, pos: 43 }
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
      }
    });
  });
})
