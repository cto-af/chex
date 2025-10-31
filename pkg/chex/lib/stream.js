import {
  charMap, dotMap, utf8decode,
} from './encoding.js';
import {Transform} from 'node:stream';
import {select} from '@cto.af/utils';

/**
 * @typedef {'utf8' | 'utf16le' | 'utf-16le'} SupportedEncoding
 */

/**
 * @typedef {object} HexOptions
 * @property {boolean} [colors=false] Print with colors?
 * @property {boolean} [dots=false] Use dots for CTLS and > 0x7f
 * @property {SupportedEncoding|null} [decode] Attempt to decode strings.
 * @property {SupportedEncoding} [encoding='utf8'] If the input is a string, how
 *   to decode it.
 * @property {number} [firstByte=0] Number to use for the first byte.
 * @property {boolean} [printLength=true] Print the total length at the end.
 * @property {number} [indent=0] Number of spaces to indent each line.
 * @property {boolean} [trailingLinefeed=true] If true, end the last line with
 *   a newline.
 * @property {number} [columns=2] How many columns of eight bytes per line?
 * @property {number} [digits=8] How many digits to pad to in the byte count?
 */

/**
 * @typedef {Required<HexOptions>} ProcessedHexOptions
 */

/** @import {DuplexOptions} from 'node:stream' */
/**
 * @typedef {HexOptions & DuplexOptions} HexDumpStreamOptions
 */

export class HexDumpTransform extends Transform {
  /** @type {ProcessedHexOptions} */
  static defaultOptions = {
    colors: false,
    dots: false,
    encoding: 'utf8',
    decode: null,
    firstByte: 0,
    printLength: true,
    indent: 0,
    trailingLinefeed: true,
    columns: 2,
    digits: 8,
  };

  /** @type {ProcessedHexOptions} */
  #opts;
  #offset = 0;
  #lineWidth = 0;
  #indent = '';

  /** @type {Uint8Array} */
  #last;
  #lastOffset = 0;

  /**
   * @param {HexDumpStreamOptions} options
   */
  constructor(options = {}) {
    const [opts, streamOpts] = select(options, HexDumpTransform.defaultOptions);
    super(streamOpts);
    this.#opts = opts;
    this.#lineWidth = this.#opts.columns * 8;
    this.#indent = ''.padEnd(this.#opts.indent, ' ');
    this.#last = new Uint8Array(this.#lineWidth);
  }

  /**
   * @returns {ProcessedHexOptions}
   */
  get options() {
    return {...this.#opts};
  }

  _transform(chunk, _encoding, cb) {
    let ret = '';
    for (const byte of chunk) {
      if ((this.#lastOffset % this.#lineWidth) === 0) {
        if (this.#offset !== 0) {
          ret += this.#printableString();
        }
        this.#lastOffset = 0;
        ret += this.#count(this.#opts.firstByte + this.#offset);
      }
      if ((this.#offset % 8) === 0) {
        ret += ' ';
      }
      ret += ' ';
      ret += byte.toString(16).padStart(2, '0');
      this.#offset++;
      this.#last[this.#lastOffset++] = byte;
    }
    this.push(ret);
    cb();
  }

  _flush(cb) {
    let ret = '';
    if (this.#lastOffset > 0) {
      let left = this.#offset % this.#lineWidth;
      if (left === 0) {
        left = this.#lineWidth;
      } else {
        // There are 3 chars per byte ("xx ").  For each column boundary that
        // we haven't crossed add one.
        const right = this.#lineWidth - left;
        const undone = (3 * right) + Math.floor(right / 8);
        ret += ' '.padStart(undone, ' ');
      }

      ret += this.#printableString();
    }

    if (this.#opts.printLength) {
      ret += this.#count(this.#opts.firstByte + this.#offset);
      ret += this.#style(' Total', 35);
    }
    if (this.#opts.trailingLinefeed) {
      ret += '\n';
    }
    this.push(ret);
    cb();
  }

  #count(n) {
    return (this.#offset === 0 ? '' : '\n') + this.#indent + this.#style(
      n.toString(16).padStart(this.#opts.digits, '0'), 2
    );
  }

  /**
   * @param {string} str
   * @param {number} color ANSI color code
   * @returns {string}
   */
  #style(str, color) {
    return this.#opts.colors ? `\x1B[${color}m${str}\x1B[0m` : str;
  }

  /**
   * Each byte that is "printable" takes up one grapheme, and everything else is
   * replaced with '.'
   *
   * @returns {string}
   */
  #printableString() {
    let res = '  |';

    for (let i = 0; i < this.#lastOffset; i++) {
      if (this.#opts.decode) {
        const {str, extra, msg} = utf8decode(this.#last, i, this.#lastOffset);
        const pstr = str + ''.padEnd(extra, ' ');
        if (msg) {
          res += pstr;
        } else {
          res += this.#style(pstr, 32);
        }

        i += extra;
      } else {
        const x = this.#last[i];
        const c = this.#opts.dots ? dotMap[x] : charMap[x];
        if (x > 32 && x < 127) {
          res += this.#style(c, 32);
        } else {
          res += c;
        }
      }
    }

    res += '|';
    return res;
  }
}
