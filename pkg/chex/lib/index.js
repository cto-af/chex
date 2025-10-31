import {parseEncoding, utf16encode} from './encoding.js';
import {HexDumpTransform} from './stream.js';

export {
  HexDumpTransform,
};

/**
 * @typedef {Int8Array | Uint8Array | Uint8ClampedArray | Int16Array |
 *           Uint16Array | Int32Array | Uint32Array | BigUint64Array |
 *           Float32Array | Float64Array} TypedArray
 */

/** @import {HexOptions, ProcessedHexOptions} from './stream.js' */

/**
 * @param {any} a
 * @returns {a is TypedArray}
 */
function isTypedArray(a) {
  return typeof (a?.buffer) === 'object';
}

/**
 * @param {string | TypedArray | import('buffer').Buffer} buf
 * @param {ProcessedHexOptions} opts
 * @returns {Uint8Array}
 */
function toUint8Array(buf, opts) {
  if (buf instanceof Uint8Array) {
    return buf;
  }
  if (Array.isArray(buf)) {
    return new Uint8Array(buf);
  }
  if (typeof buf === 'string') {
    const {eight, little} = parseEncoding(opts.encoding);
    if (eight) {
      return new TextEncoder().encode(buf);
    }
    return utf16encode(buf, little);
  }
  if (isTypedArray(buf)) {
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  throw new Error('Unable to convert to Uint8Array');
}

/**
 * A nice hex representation of the given buffer.
 *
 * @param {TypedArray | import('buffer').Buffer} input The buffer
 *   to dump.
 * @param {HexOptions} [options]
 * @returns {string} True if output was written.
 */
export function hexDump(input, options) {
  const xform = new HexDumpTransform(options);
  const buf = toUint8Array(input, xform.options);
  xform.end(buf);
  return xform.read().toString();
}
