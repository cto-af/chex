import {Transform} from 'node:stream';
import {hexDump} from '@cto.af/chex';

/**
 * @typedef {Partial<import('@cto.af/chex').HexOptions> &
 *   import('node:stream').DuplexOptions} HexDumpStreamOptions
 */

export class HexDumpTransform extends Transform {
  /** @type {HexDumpStreamOptions} */
  #opts;
  #buf = new Uint8Array(16);
  #bufLen = 0;

  /**
   *
   * @param {HexDumpStreamOptions} options
   */
  constructor(options = {}) {
    super(options);
    this.#opts = {
      firstByte: 0,
      ...options,
      printLength: false,
    };
  }

  /**
   * Transform a chunk of bytes.
   * @param {Uint8Array} chunk
   * @param {BufferEncoding} _encoding Should be null
   * @param {import('node:stream').TransformCallback} callback
   */
  _transform(chunk, _encoding, callback) {
    let res = '';
    if (this.#bufLen > 0) {
      const front = Math.min(chunk.length, 16 - this.#bufLen);
      if (front > 0) {
        this.#buf.set(chunk.subarray(0, front), this.#bufLen);
        this.#bufLen += front;
        chunk = chunk.subarray(front);
      }
      if (this.#bufLen === 16) {
        res += hexDump(this.#buf, this.#opts);
        this.#opts.firstByte += 16;
        this.#bufLen = 0;
      }
    }
    if (chunk.length > 0) {
      const tail = chunk.length % 16;
      if (tail > 0) {
        this.#buf.set(chunk.subarray(-tail), this.#bufLen);
        this.#bufLen += tail;
        chunk = chunk.subarray(0, -tail);
      }
      // Should be multiple of 16 now
      if (chunk.length > 0) {
        res += hexDump(chunk, this.#opts);
        this.#opts.firstByte += chunk.length;
      }
    }
    callback(null, res);
  }

  /**
   * @param {import('node:stream').TransformCallback} callback
   */
  _flush(callback) {
    callback(null, hexDump(this.#buf.subarray(0, this.#bufLen), {
      ...this.#opts,
      printLength: true,
    }));
  }
}

//
// process.stdin.pipe(new HexDumpTransform()).pipe(process.stdout);
