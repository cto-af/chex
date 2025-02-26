import {hexDump} from '../lib/index.js';
import test from 'ava';

test('defaults', t => {
  t.snapshot(hexDump(''));
  t.snapshot(hexDump('0123456789abcdef'), 'one full line');
  t.snapshot(hexDump('0123456789abcdef0'), 'wrap to next line');
  t.snapshot(hexDump([0x61, 0x62, 0x63]), 'plain array');
  t.snapshot(hexDump(new Uint8Array([0x61, 0x62, 0x63])), 'Uint8Array');
  t.snapshot(hexDump(new Uint16Array([0x61, 0x62, 0x63])), 'Uint16Array');

  t.throws(() => hexDump());
  t.throws(() => hexDump(null));
  t.throws(() => hexDump({}));
});

test('encoding', t => {
  t.snapshot(hexDump('\u{1F4A9}', {
    encoding: 'utf8',
  }), 'utf8');
  t.snapshot(hexDump('012345678', {
    encoding: 'utf16',
  }), 'little endian');
  t.snapshot(hexDump('012345678', {
    encoding: 'utf16be',
  }), 'big endian');
  t.throws(() => hexDump('', {encoding: 'unknown'}));
});

test('dots', t => {
  t.snapshot(hexDump('\x00', {dots: false}), 'fewer dots');
  t.snapshot(hexDump('\x00', {dots: true}), 'more dots');
});

test('colors', t => {
  t.snapshot(hexDump('0\n1', {colors: true}));
});

test('decode', t => {
  const te = new TextEncoder();
  const poo = te.encode('\u{1F4A9}');
  t.snapshot(hexDump(poo, {decode: true}), '\u{1F4A9}');

  // Get continuation msg
  const oo = new Uint8Array([0x9F, 0x92, 0xA9, 0x61]);
  t.snapshot(hexDump(oo, {decode: true}), '..a');
});
