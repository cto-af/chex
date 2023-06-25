// eslint-disable-next-line n/no-extraneous-import
import test from 'ava'
import {utf8decode} from '../lib/encoding.js'

test('utf8decode', t => {
  /* eslint-disable array-element-newline */
  const s = new Uint8Array([
    0x61, // 'a'
    0x00, // Null
    0xF0, 0x9F, 0x92, 0xA9, // Pile of poo
    0x9F, // Bare continuation
    0xFF, // Not UTF8
    0xC2, 0xA3, // Pound
    0xE0, 0xA0, 0x80, // SAMARITAN LETTER ALAF
    0xE0, 0x00, // Not continued
    0xF0, 0x9F, 0x87, 0xBA, 0xF0, 0x9F, 0x87, 0xB8, // US Flag
    0xE2, 0x80, 0x8D, // ZERO WIDTH JOINER
    0xCC, 0x80, // COMBINING GRAVE ACCENT
  ])
  /* eslint-enable array-element-newline */

  t.deepEqual(utf8decode(s, 0, s.length), {str: 'a', extra: 0})
  t.deepEqual(utf8decode(s, 1, s.length), {str: '.', extra: 0})
  t.deepEqual(utf8decode(s, 2, s.length), {str: '\u{1F4A9}', extra: 3})
  t.deepEqual(utf8decode(s, 6, s.length), {str: '.', extra: 0, msg: 'continuation'})
  t.deepEqual(utf8decode(s, 7, s.length), {str: '.', extra: 0, msg: 'continuation'})
  t.deepEqual(utf8decode(s, 8, s.length), {str: '\u00a3', extra: 1})
  t.deepEqual(utf8decode(s, 10, s.length), {str: '\u{800}', extra: 2})
  t.deepEqual(utf8decode(s, 13, s.length), {str: '.', extra: 0, msg: 'not continued'})
  t.deepEqual(utf8decode(s, 13, 14), {str: '.', extra: 0, msg: 'truncated'})
  t.deepEqual(utf8decode(s, 15, s.length), {str: 'U\u20DE', extra: 3})
  t.deepEqual(utf8decode(s, 19, s.length), {str: 'S\u20DE', extra: 3})
  t.deepEqual(utf8decode(s, 23, s.length), {str: '.', extra: 2, msg: 'control'})
  t.deepEqual(utf8decode(s, 26, s.length), {str: '\u25cc\u0300', extra: 1})
})
