
import path from 'path';
import vue from '@vitejs/plugin-vue';



const SRC_DIR = path.resolve(__dirname, './src');
const PUBLIC_DIR = path.resolve(__dirname, './public');
const BUILD_DIR = path.resolve(__dirname, './www',);

export default {
  plugins: [
    vue(),

  ],
  root: SRC_DIR,
  base: '',
  publicDir: PUBLIC_DIR,
  build: {
    outDir: BUILD_DIR,
    assetsInlineLimit: 0,
    emptyOutDir: true,
  },
  server : {
    https : true,
  },
  resolve: {
    alias: {
      '@': SRC_DIR,
      '@js': SRC_DIR+"/js",
      '@components' : SRC_DIR+"/components",
      '@pages' : SRC_DIR+"/pages"
    },
  },

};
