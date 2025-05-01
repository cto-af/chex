import {Buffer} from 'node:buffer';
import {HexDumpTransform} from '../lib/stream.js';
import {promisify} from 'node:util';
import test from 'ava';

test('HexDumpTransform', async t => {
  const str = new HexDumpTransform();
  let out = '';
  str.on('data', s => {
    out += s;
  });
  const write = promisify(str.write.bind(str));
  const end = promisify(str.end.bind(str));

  await write(Buffer.from('0123'));
  t.is(out, '');
  await write(Buffer.from('0123'));
  t.is(out, '');
  await write(Buffer.from('0123'));
  t.is(out, '');
  await write(Buffer.from('0123'));
  t.snapshot(out);
  await write(Buffer.from('01234'));
  t.snapshot(out);
  await write(Buffer.from('56789abcdef'));
  t.snapshot(out);
  await write(Buffer.from('01234'));
  await write(Buffer.from('56789abcdef0123456789abcdefend'));
  await end();
  t.snapshot(out);
});
