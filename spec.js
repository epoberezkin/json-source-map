'use strict';

var jsonMap = require('.');
var assert = require('assert');


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
    assert.deepEqual(data, JSON.parse(json));
    assert.deepEqual(pointers, {
      '': { line: 0, column: 0 },
      '/foo': { line: 1, column: 9 },
      '/foo/0': { line: 2, column: 4 },
      '/foo/0/bar': { line: 3, column: 13 }
    });
  });
})
