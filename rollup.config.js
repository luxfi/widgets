import typescript from '@rollup/plugin-typescript';
import image from '@rollup/plugin-image';

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'es'
  },
  plugins: [typescript(), image()]
};