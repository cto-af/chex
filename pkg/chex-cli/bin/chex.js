#!/usr/bin/env node
/* eslint-disable no-console */

import {Command, Option} from 'commander';
import {HexDumpTransform} from '../lib/stream.js';
import fs from 'node:fs';
import {version} from '../lib/version.js';
import {version as libVersion} from '@cto.af/chex/lib/version.js';

const program = new Command();
program
  .argument('[file...]', 'file names to read or "-" for stdin')
  .option('-c,--colors', 'force colors on even if stdout is not a tty')
  .option('-d,--dots', 'use dots for more control characters, instead of Unicode representations')
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

function main(argv) {
  for (const fn of argv) {
    if (argv.length > 1) {
      console.log(fn);
    }
    const str = (fn === '-') ?
      process.stdin :
      fs.createReadStream(fn);
    str.pipe(new HexDumpTransform({
      colors: opts.colors || process.stdout.isTTY,
      dots: opts.dots,
      decode: opts.strings,
    })).pipe(process.stdout);
  }
}

main(args);
