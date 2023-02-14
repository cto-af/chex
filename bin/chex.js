#!/usr/bin/env node
/* eslint-disable no-console */

import {Buffer} from 'buffer'
import fs from 'fs'
import {hexDump} from '../lib/index.js'

const args = process.argv.slice(2)
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
      new Uint8Array(await fs.promises.readFile(fn))
    console.log(hexDump(buf, {
      colors: process.stdout.isTTY,
    }))
  }
}

main(args).catch(console.error)
