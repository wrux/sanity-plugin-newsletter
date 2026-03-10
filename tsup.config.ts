import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.tsx' },
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ['react', 'react-dom', 'sanity', '@sanity/icons', '@sanity/ui'],
  },
  {
    entry: { index: 'src/next/index.ts' },
    outDir: 'dist/next',
    format: ['cjs', 'esm'],
    dts: false,
    sourcemap: true,
    external: ['react', 'react-dom'],
  },
]);
