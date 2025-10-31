#!/usr/bin/env node

import {Command, Option} from 'commander';
import {HexDumpTransform} from '@cto.af/chex';
import fs from 'node:fs';
import {version as libVersion} from '@cto.af/chex/lib/version.js';
import {spawn} from 'node:child_process';
import {version} from '../lib/version.js';

const program = new Command();
program
  .argument('[file...]', 'file names to read or "-" for stdin')
  .option('-c,--colors', 'force colors on even if stdout is not a tty')
  .option('--no-colors', 'force colors off even if stdout is a tty')
  .option('-C,--columns <number>', 'how many columns of 8 bytes?', 2)
  .option('-d,--dots', 'use dots for more control characters, instead of Unicode representations')
  .option('-p,--pager [pager command]',
    'override PAGER environment variable.  If no command is specified, turn off paging.  Suggested: "less -REX".',
    process.env.PAGER ?? 'more')
  .addOption(new Option(
    '-s,--strings <encoding>',
    'try to decode strings in this encoding'
  ).choices(['utf8', 'utf-8']))
  .version(`${version}, lib:${libVersion}`)
  .parse();

const opts = program.opts();
const {args} = program;
if (args.length === 0) {
  args.push('-');
}

function pager(pg) {
  return new Promise((resolve, reject) => {
    const child = spawn(pg, {
      shell: true,
      stdio: ['pipe', 'inherit', 'inherit'],
    });
    child.on('error', reject);
    child.on('spawn', () => resolve(child.stdin));
  });
}

function readStream(s) {
  return new Promise((resolve, reject) => {
    s.on('error', reject);
    s.on('end', resolve);
  });
}

async function main(argv) {
  if (opts.pager === 'more') {
    opts.colors = false;
  }
  let out = process.stdout;
  if (typeof opts.pager === 'string') {
    out = await pager(opts.pager);
  }

  try {
    for (const fn of argv) {
      if (argv.length > 1) {
        out.write('File: ');
        out.write(fn);
        out.write('\n');
      }
      const str = (fn === '-') ?
        process.stdin :
        fs.createReadStream(fn);
      str
        .pipe(new HexDumpTransform({
          colors: opts.colors ?? process.stdout.isTTY,
          columns: opts.columns,
          dots: opts.dots,
          decode: opts.strings,
        }))
        .pipe(out, {end: false});
      await readStream(str);
    }
  } finally {
    out.end();
  }
}

main(args).catch(er => console.error(er.message));
