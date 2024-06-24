export const charMap = '␀␁␂␃␄␅␆␇␈␉␊␋␌␍␎␏␐␑␒␓␔␕␖␗␘␙␚␛␜␝␞␟ !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~␡.................................¡¢£¤¥¦§¨©ª«¬.®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ';
const utf8Map = '................................ !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~.';
export const dotMap = utf8Map.padEnd(256, '.');

// UTF-8, UTF16, UTF16BE, utf-16LE, etc.
const validEncoding = /^utf-?(?:(?<eight>8)|(?:16-?(?<endian>be|le)?))$/i;

// Is the runtime encoding little-endian?
export const LITTLE = (new Uint16Array(
  new Uint8Array([1, 2]).buffer
)[0] === 0x0201);

/**
 * @param {string} e
 * @returns {{eight: boolean, little: boolean}}
 */
export function parseEncoding(e) {
  const m = e.match(validEncoding);
  if (!m) {
    throw new Error(`Unknown string encoding "${m}"`);
  }
  return {
    eight: Boolean(m.groups.eight),
    little: m.groups.endian ?
      (m.groups.endian.toLowerCase() === 'le') :
      LITTLE,
  };
}

/**
 * @typedef {object} Decoded
 * @property {string} str
 * @property {number} extra
 * @property {string} [msg]
 */

/**
 * @type {Decoded}
 */
const DECODE_ERROR = {str: '.', extra: 0};

/**
 * Try to return a single printable grapheme cluster for the read point,
 * that has the most information without combining with another character.
 * Synthetic combining targets and enclosing squares may be added.
 *
 * @param {Uint8Array} buf
 * @param {number} offset
 * @param {number} length
 * @returns {Decoded}
 */
export function utf8decode(buf, offset, length) {
  let val = buf[offset];
  let extra = 0;
  let str = utf8Map[val];
  if (str) {
    return {str, extra};
  }

  if (((val & 0b11_000000) === 0b10_000000) || // Continuation
      ((val & 0b11111_000) === 0b11111_000)) { // 4 bytes max
    return {...DECODE_ERROR, msg: 'continuation'};
  }
  if ((val & 0b111_00000) === 0b110_00000) {
    val &= 0b000_11111;
    extra = 1;
  } else if ((val & 0b1111_0000) === 0b1110_0000) {
    val &= 0b0000_1111;
    extra = 2;
  } else { // Invariant: (val & 0b11111_000) === 0b11110_000
    val &= 0b00000_111;
    extra = 3;
  }

  for (let i = 1; i <= extra; i++) {
    if (offset + i >= length) {
      return {...DECODE_ERROR, msg: 'truncated'};
    }
    const b = buf[offset + i];
    if ((b & 0b11_000000) !== 0b10_000000) {
      return {...DECODE_ERROR, msg: 'not continued'};
    }
    val = (val << 6) | (b & 0b00_111111);
  }

  if ((val >= 0x1F1E6) && (val <= 0x1F1FF)) {
    // REGIONAL INDICATORs.
    // Turn the first one into A with a box around it, etc.
    str = `${String.fromCharCode(val - 0x1f1a5)}\u20DE`;
  } else {
    str = String.fromCodePoint(val);
    if (/^\p{C}$/u.test(str)) {
      return {...DECODE_ERROR, extra, msg: 'control'}; // E.g. U+200B ZERO WIDTH SPACE
    }
    if (/^\p{Mn}$/u.test(str)) {
      str = `\u25cc${str}`; // Combining.  Add a dotted circle in front
    }
  }

  // There are probably lots of other cases.  Please file an issue!
  return {str, extra};
}

/**
 * @param {string} s
 * @param {boolean} little Endianness
 * @returns {Uint8Array}
 */
export function utf16encode(s, little) {
  const len2 = s.length * 2;
  const ab = new ArrayBuffer(len2);
  const dv = new DataView(ab);
  for (let i = 0, j = 0; i < len2; i += 2, j++) {
    dv.setUint16(i, s.charCodeAt(j), little);
  }
  return new Uint8Array(ab);
}
