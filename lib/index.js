// Keep this completely dependency-free modernish (ES2020) web-runnable code.

const charMap = '␀␁␂␃␄␅␆␇␈␉␊␋␌␍␎␏␐␑␒␓␔␕␖␗␘␙␚␛␜␝␞␟ !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~␡.................................¡¢£¤¥¦§¨©ª«¬.®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ'
const utf8Map = '.................................................. !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~.'
const dotMap = utf8Map.padEnd(256, '.')

function style(str, color) {
  return `\x1B[${color}m${str}\x1B[39m`
}

/**
 * @typedef {"utf8"} SupportedEncoding
 */

/**
 * @typedef {object} HexOptions
 * @property {boolean} [colors=false] Print with colors?
 * @property {boolean} [dots=false] Use dots for CTLS and > 0x7f
 * @property {SupportedEncoding} [encoding='utf8'] If the input is a string, how
 *   to decode it.
 */

/**
 * @typedef {Required<HexOptions>} ProcessedHexOptions
 */

/* eslint-disable max-len */
/**
 * @typedef {Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | BigUint64Array | Float32Array | Float64Array} TypedArray
 */
/* eslint-enable max-len */

/**
 * @param {any} a
 * @returns {a is TypedArray}
 */
function isTypedArray(a) {
  return typeof (a?.buffer) === 'object'
}

/**
 * @param {string} s
 * @param {boolean} little Endianness
 * @returns {Uint8Array}
 */
function utf16encode(s, little) {
  const len2 = s.length * 2
  const ab = new ArrayBuffer(len2)
  const dv = new DataView(ab)
  for (let i = 0, j = 0; i < len2; i += 2, j++) {
    dv.setUint16(i, s.charCodeAt(j), little)
  }
  return new Uint8Array(ab)
}

/**
 * @param {string | TypedArray | import('buffer').Buffer} buf
 * @param {ProcessedHexOptions} opts
 * @returns {Uint8Array}
 */
function toUint8Array(buf, opts) {
  if (buf instanceof Uint8Array) {
    return buf
  }
  if (Array.isArray(buf)) {
    return new Uint8Array(buf)
  }
  if (typeof buf === 'string') {
    if (['utf8', 'utf-8'].indexOf(opts.encoding.toLocaleLowerCase()) >= 0) {
      const enc = new TextEncoder()
      return enc.encode(buf)
    }
    if (['utf16', 'utf-16', 'utf16le', 'utf-16le'].indexOf(opts.encoding.toLocaleLowerCase()) >= 0) {
      return utf16encode(buf, true)
    }
    if (['utf16be', 'utf-16be'].indexOf(opts.encoding.toLocaleLowerCase()) >= 0) {
      return utf16encode(buf, false)
    }
    throw new Error(`Unknown string encoding "${opts.encoding}"`)
  }
  if (isTypedArray(buf)) {
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
  }
  throw new Error('Unable to convert to Uint8Array')
}

/**
 * Each byte that is "printable" takes up one grapheme, and everything else is
 * replaced with '.'
 *
 * @param {Uint8Array} buf
 * @param {ProcessedHexOptions} opts
 * @returns {string}
 */
function printableString(buf, opts) {
  let res = ''
  for (const x of buf) {
    const c = opts.dots ? dotMap[x] : charMap[x]
    if (opts.colors) {
      if (x > 32 && x < 127) {
        res += style(c, 32)
      } else {
        res += c
      }
    } else {
      res += c
    }
  }
  return res
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
    colors: true,
    dots: false,
    encoding: 'utf8',
    ...options,
  }
  const buf = toUint8Array(input, opts)
  let ret = ''

  if (buf.length > 0) {
    let offset = 0
    for (const byte of buf) {
      if ((offset % 16) === 0) {
        if (offset !== 0) {
          ret += '  |'
          ret += printableString(buf.slice(offset - 16, offset), opts)
          ret += '|\n'
        }
        ret += offset.toString(16).padStart(8, '0')
      }
      if ((offset % 8) === 0) {
        ret += ' '
      }
      ret += ' '
      ret += byte.toString(16).padStart(2, '0')
      offset++
    }
    let left = offset % 16
    if (left === 0) {
      left = 16
    } else {
      let undone = 3 * (16 - left)
      if (left <= 8) {
        undone++
      }
      ret += ' '.padStart(undone, ' ')
    }

    const start = offset > 16 ? offset - left : 0
    ret += '  |'
    ret += printableString(buf.slice(start, offset), opts)
    ret += '|\n'
  }
  ret += buf.length.toString(16).padStart(8, '0')
  ret += '\n'
  return ret
}
