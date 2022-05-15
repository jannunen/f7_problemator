import path from 'path';
import framework7 from 'rollup-plugin-framework7';
import vue from '@vitejs/plugin-vue'

const SRC_DIR = path.resolve(__dirname, './src');
const PUBLIC_DIR = path.resolve(__dirname, './public');
const BUILD_DIR = path.resolve(__dirname, './www');

export default {
  plugins: [vue(), framework7({ emitCss: false })],
  root: SRC_DIR,
  base: '',
  publicDir: PUBLIC_DIR,
  build: {
    outDir: BUILD_DIR,
    assetsInlineLimit: 0,
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': SRC_DIR,
      '@js': SRC_DIR+"/js",
      '@helpers' : SRC_DIR+"/js/helpers",
      '@auth' : SRC_DIR+"/js/auth",
      '@components' : SRC_DIR+"/components",
      '@pages' : SRC_DIR+"/pages"
    },
  },
  server: {
    host: true,
    https : true,
  },
  esbuild: {
    jsxFactory: '$jsx',
    jsxFragment: '"Fragment"',
  },
};
