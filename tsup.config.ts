// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/lib/index.ts',
    cli: 'src/bin/cli.ts',
    'bash-complete': 'src/bin/bash-complete.ts',
  },
  format: ['esm', 'cjs'],
  dts: {
    resolve: true,
  },
  outDir: 'dist',
  splitting: false,
  sourcemap: true,
  clean: true,
  shims: true,
});
