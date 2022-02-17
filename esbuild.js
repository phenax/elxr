const esbuild = require('esbuild');

esbuild
  .build({
    entryPoints: ['src/index.ts'],
    outdir: 'lib',
    bundle: true,
    sourcemap: true,
    minify: true,
    splitting: false,
    format: 'cjs',
    target: ['es2015']
  })
  .catch(e => (console.error(e), process.exit(1)));
