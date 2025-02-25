import {
  charMap, dotMap, parseEncoding, utf16encode, utf8decode,
} from './encoding.js';

/**
 * @typedef {Int8Array | Uint8Array | Uint8ClampedArray | Int16Array |
 *           Uint16Array | Int32Array | Uint32Array | BigUint64Array |
 *           Float32Array | Float64Array} TypedArray
 */

/**
 * @typedef {'utf8' | 'utf16' | 'utf-16' | 'utf16le' | 'utf-16le' |
 *           'utf16be' | 'utf-16be'} SupportedEncoding
 */

/**
 * @typedef {object} HexOptions
 * @property {boolean} [colors=false] Print with colors?
 * @property {boolean} [dots=false] Use dots for CTLS and > 0x7f
 * @property {SupportedEncoding|null} [decode] Attempt to decode strings.
 * @property {SupportedEncoding} [encoding='utf8'] If the input is a string, how
 *   to decode it.
 */

/**
 * @typedef {Required<HexOptions>} ProcessedHexOptions
 */

/**
 * @param {string} str
 * @param {number} color ANSI color code
 * @param {ProcessedHexOptions} opts
 * @returns {string}
 */
function style(str, color, opts) {
  return opts.colors ? `\x1B[${color}m${str}\x1B[39m` : str;
}

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
 * Each byte that is "printable" takes up one grapheme, and everything else is
 * replaced with '.'
 *
 * @param {Uint8Array} buf
 * @param {number} offset
 * @param {number} length
 * @param {ProcessedHexOptions} opts
 * @returns {string}
 */
function printableString(buf, offset, length, opts) {
  let res = '';

  for (let i = 0; (i < 16) && (offset + i < length); i++) {
    if (opts.decode) {
      const {str, extra, msg} = utf8decode(buf, offset + i, length);
      const pstr = str + ''.padEnd(extra, ' ');
      if (msg) {
        res += pstr;
      } else {
        res += style(pstr, 32, opts);
      }

      i += extra;
    } else {
      const x = buf[i + offset];
      const c = opts.dots ? dotMap[x] : charMap[x];
      if (x > 32 && x < 127) {
        res += style(c, 32, opts);
      } else {
        res += c;
      }
    }
  }

  return res;
}

/**
 * A nice hex representation of the given buffer.
 *
 * @param {TypedArray | import('buffer').Buffer} input The buffer
 *   to dump.
 * @param {Partial<HexOptions>} [options]
 * @returns {string} True if output was written.
 */
export function hexDump(input, options) {
  /** @type {ProcessedHexOptions} */
  const opts = {
    colors: false,
    dots: false,
    encoding: 'utf8',
    decode: null,
    ...options,
  };
  const buf = toUint8Array(input, opts);
  let ret = '';

  const len = buf.length;
  if (len > 0) {
    let offset = 0;
    for (const byte of buf) {
      if ((offset % 16) === 0) {
        if (offset !== 0) {
          ret += '  |';
          ret += printableString(buf, offset - 16, len, opts);
          ret += '|\n';
        }
        ret += offset.toString(16).padStart(8, '0');
      }
      if ((offset % 8) === 0) {
        ret += ' ';
      }
      ret += ' ';
      ret += byte.toString(16).padStart(2, '0');
      offset++;
    }
    let left = offset % 16;
    if (left === 0) {
      left = 16;
    } else {
      let undone = 3 * (16 - left);
      if (left <= 8) {
        undone++;
      }
      ret += ' '.padStart(undone, ' ');
    }

    const start = offset > 16 ? offset - left : 0;
    ret += '  |';
    ret += printableString(buf, start, len, opts);
    ret += '|\n';
  }
  ret += buf.length.toString(16).padStart(8, '0');
  ret += '\n';
  return ret;
}
