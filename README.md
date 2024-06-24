# chex

Like `hexdump -C`, but as a small JS library.

## Install

```
npm install @cto.af/chex-cli
```

## Usage

```
Usage: chex [options] [file...]

Arguments:
  file                     file names to read or "-" for stdin

Options:
  -c,--colors              force colors on even if stdout is not a tty
  -d,--dots                use dots for more control characters, instead of
                           Unicode representations
  -s,--strings <encoding>  try to decode strings in this encoding (choices:
                           "utf8", "utf-8")
  -h, --help               display help for command
```

[![Tests](https://github.com/cto-af/chex/actions/workflows/node.js.yml/badge.svg)](https://github.com/cto-af/chex/actions/workflows/node.js.yml)
[![codecov](https://codecov.io/gh/cto-af/chex/graph/badge.svg?token=S79ZXFIMZS)](https://codecov.io/gh/cto-af/chex)