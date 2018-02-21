import minify from 'rollup-plugin-babel-minify';
import cjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

export default [{
    input: 'src/index.ts',
    output: {
        file: 'dist/bundle.min.js',
        format: 'es',
        sourcemap: false,
    },
    plugins: [ // No nodeResolve here to avoid bundling dependencies
        typescript(),
        cjs(),
        minify({ comments: false }),
    ],
}, {
    input: 'src/index.ts',
    output: {
        file: 'dist/bundle+deps.min.js',
        format: 'es',
        sourcemap: false,
    },
    plugins: [
        nodeResolve({ browser: true }),
        typescript(),
        cjs(),
        minify({ comments: false }),
    ],
}];