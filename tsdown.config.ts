import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    'index': 'src/lib/index.ts',
    'cli': 'src/bin/cli.ts',
    'bash-complete': 'src/bin/bash-complete.ts',
  },
  format: ['esm', 'cjs'],
  dts: {
    build: true,
  },
  outDir: 'dist',
  sourcemap: true,
  clean: true,
  shims: true,
  target: false,
})
