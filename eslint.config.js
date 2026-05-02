import ava from '@cto.af/eslint-config/ava.js';
import {defineConfig} from 'eslint/config';
import es6 from '@cto.af/eslint-config/es6.js';

export default defineConfig(
  es6,
  ava
);
