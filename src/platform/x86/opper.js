const TextEncoder = require('util/text_encoder');
const more_util = require('more_util');

const INDEX_SIZE = 4;
  
class Opper
{
  constructor() {
    this.byte_size = 0;
    this.ops = [];
    this.data = [];
    this.labels = {
      'doop': -1,
      'call-data-seq-code': -2,
      'value-peeker-code': -3,
      'variable-peeker-code': -4,
      'terminator-entry-data': 1347376211
    };
  }

  resolve_labels(ops) {
    var undefined_labels = [];
    var ops = more_util.map_each_n(ops, (o, n) => {
      if(typeof(o) == 'object') {
        if(o.kind == 'relative-label') {
        var v = this.resolve(o.label);
        if(o.relative) v = v - n;
          if(o.fn) v = o.fn(v);
          if(o.relative && o.label.match(/-end$/)) v = v * 4;
          return v;
        } else if(o.kind == 'data') {
          return o.value.reduce((a, x) => {
            a.push(x);
            return a;
          }, new Array());
        }
      } else if(typeof(o) == 'string') {
        var l = this.resolve(o, true);
        if(l != null) return l;
        else {
          undefined_labels[o] = n;
          return o;
        }
        //return o;
      } else {
        return o;
      }
    });
    return [ ops, Object.keys(undefined_labels) ];
  }

  pack_cells(ops) {
    var bytes = new Uint8Array(this.byte_size);
    var dv = new DataView(bytes.buffer);
    var offset = 0;
    for(var i = 0; i < ops.length; i++) {
      if(typeof(ops[i]) == 'number') {
        dv.setInt32(offset, ops[i], true);
        offset += 4;
      } else {
        if(ops[i] instanceof Array) {
          for(var j = 0; j < ops[i].length; j++) {
            dv.setUint8(offset, ops[i][j], true);
            offset += 1;
          }
        } else if(ops[i].kind == 'data') {
          for(var j = 0; j < ops[i].value.length; j++) {
            dv.setUint8(offset, ops[i].value[j], true);
            offset += 1;
          }
        } else {
          throw { msg: "Unknown op at " + i, op: ops[i] };
        }
      }
    }
    return bytes;
  }
  
  dbg_assemble() {
    var encoder = new TextEncoder();
    var labels = this.resolve_labels(this.ops);
    var bin;
    if(labels[1].length == 0) {
      bin = this.pack_cells(labels[0]);
    }
    return {
      undefined_labels: labels[1],
      bin: bin,
      indexes: labels[0],
      ops: this.ops,
      labels: this.labels
    };
  }
  
  assemble() {
    var labels = this.resolve_labels(this.ops);
    if(labels[1].length == 0) {
      return this.pack_cells(labels[0]);
    } else {
      throw("Undefined labels: " + labels[1].join(', '));
    }
  }
  
  uint32(v, relative, fn) {
    if(relative) {
      this.ops.push({ kind: 'relative-label',
                      label: v,
                      relative: relative,
                      fn: fn
                    });
    } else {
      this.ops.push(v);
    }
    this.byte_size += 4;
    return this;
  }

  label(name) {
    this.labels[name] = this.ops.length;
    return this;
  }

  resolve(name, unexceptional) {
    var v = this.labels[name];
    if(!unexceptional && v == null) throw("Undefined label: " + name);
    return v;
  }

  bytes(s) {
    //this.data.push(s);
    //this.ops.push(this.data.length);
    this.ops.push({ kind: 'data', value: s });
    this.byte_size += s.length;
    return this;
  }
}

if(typeof(module) != 'undefined') {
  module.exports = Opper;
}
