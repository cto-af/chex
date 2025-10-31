import {execa} from 'execa';
import {fileURLToPath} from 'node:url';
import test from 'ava';

const bin = new URL('../bin/chex.js', import.meta.url);
const pkg = fileURLToPath(new URL('../package.json', import.meta.url));

test('stdin', async t => {
  const {stdout} = await execa(bin, {node: true, input: 'foo'});
  t.snapshot(stdout);
});

test('no pager', async t => {
  const {stdout} = await execa(bin, {node: true, input: 'foo', env: {PAGER: undefined}});
  t.snapshot(stdout);
});

test('less as pager', async t => {
  const {stdout} = await execa(bin, {node: true, input: 'foo', env: {PAGER: 'less -REX'}});
  t.snapshot(stdout);
});

test('multiple files', async t => {
  const {stdout} = await execa(bin, [pkg, pkg], {node: true});
  t.true(stdout.includes(pkg));
});
