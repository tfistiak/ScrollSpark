const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser').default;
const pkg = require('./package.json');

module.exports = {
  input: 'src/index.js',
  output: [
    { file: pkg.module, format: 'es', sourcemap: true },
    { file: pkg.main,   format: 'cjs', sourcemap: true },
    { file: pkg.browser, format: 'umd', name: 'ScrollSpark', sourcemap: true },
  ],
  plugins: [
    resolve(),
    commonjs(),
    terser(),
  ],
};
