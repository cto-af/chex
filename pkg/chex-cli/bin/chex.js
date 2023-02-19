#!/usr/bin/env node
/* eslint-disable no-console */

import {Buffer} from 'buffer'
import {Command} from 'commander'
import fs from 'fs/promises'
import {hexDump} from '@cto.af/chex'

const program = new Command()
program
  .argument('[file...]', 'File names to read or "-" for stdin')
  .option('-c,--colors', 'Force colors on even if stdout is not a tty')
  .option('-d,--dots', 'Use dots for more control characters, instead of Unicode representations')
  .parse()

const opts = program.opts()
const {args} = program
if (args.length === 0) {
  args.push('-')
}

function readStdin() {
  return new Promise((resolve, reject) => {
    const bufs = []
    process.stdin.on('data', d => bufs.push(d))
    process.stdin.on('end', () => resolve(new Uint8Array(Buffer.concat(bufs))))
    process.stdin.on('error', reject)
  })
}

async function main(argv) {
  for (const fn of argv) {
    if (argv.length > 1) {
      console.log(fn)
    }
    const buf = fn === '-' ?
      await readStdin() :
      new Uint8Array(await fs.readFile(fn))
    console.log(hexDump(buf, {
      colors: opts.colors || process.stdout.isTTY,
      dots: opts.dots,
    }))
  }
}

main(args).catch(console.error)
