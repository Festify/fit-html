import cjs from 'rollup-plugin-commonjs';
import nodeGlobals from 'rollup-plugin-node-globals';
import nodeBuiltins from 'rollup-plugin-node-builtins';
import nodeResolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import path from 'path';

const distTarget = './dist/test';
const dist = (dest = "") => path.join(distTarget, dest);

const srcTarget = './test';
const src = (dest = "") => path.join(srcTarget, dest);

export default {
    input: src('index.ts'),
    output: {
        file: dist('index.js'),
        format: 'iife',
        sourcemap: true
    },
    plugins: [
        nodeBuiltins(),
        nodeResolve({ browser: true }),
        typescript(),
        cjs(),
        nodeGlobals(),
    ],
    onwarn: err => console.error(err.toString()),
};
