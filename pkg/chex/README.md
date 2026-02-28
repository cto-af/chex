# chex

Like `hexdump -C`, but as a small JS library.

## Install

```
npm install @cto.af/chex
```

## Usage

```js
import {HexDumpTransform, hexDump} from 'chex';
console.log(hexDump(new Uint8Array([0x61, 0x62, 0x63])));
// 00000000  61 62 63   |abc|
//   00000003 Total
const t = new HexDumpTransform();
t.pipe(process.stdout);
t.end(new Uint8Array([0x61, 0x62, 0x63]));
// 00000000  61 62 63   |abc|
//   00000003 Total
```

[![Tests](https://github.com/cto-af/chex/actions/workflows/node.js.yml/badge.svg)](https://github.com/cto-af/chex/actions/workflows/node.js.yml)
[![codecov](https://codecov.io/gh/cto-af/chex/graph/badge.svg?token=S79ZXFIMZS)](https://codecov.io/gh/cto-af/chex)