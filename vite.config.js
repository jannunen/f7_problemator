import path from 'path'
import framework7 from 'rollup-plugin-framework7'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import loadVersion from 'vite-plugin-package-version';
import EnvironmentPlugin from 'vite-plugin-environment'

const fs = require('node:fs');

const SRC_DIR = path.resolve(__dirname, './src')
const PUBLIC_DIR = path.resolve(__dirname, './public')
const BUILD_DIR = path.resolve(__dirname, './www')

export default defineConfig(({ command, mode }) => {
  process.env = {...process.env, ...loadEnv(mode, process.cwd())}
  return {
    plugins: [ EnvironmentPlugin('all', {prefix : 'VITE_'}),loadVersion(), basicSsl(), vue(), framework7({ emitCss: false })],
    root: SRC_DIR,
    base: '',
    publicDir: PUBLIC_DIR,
    build: {
      outDir: BUILD_DIR,
      assetsInlineLimit: 0,
      emptyOutDir: true,
      target: 'es2022',
    },
    resolve: {
      alias: {
        '@': SRC_DIR,
        '@/': SRC_DIR,
        '@js': SRC_DIR + "/js",
        '@/js': SRC_DIR + "/js",
        '@helpers': SRC_DIR + "/js/helpers",
        '@/helpers': SRC_DIR + "/js/helpers",
        '@auth': SRC_DIR + "/js/auth",
        '@components': SRC_DIR + "/components",
        '@/components': SRC_DIR + "/components",
        '@assets': SRC_DIR + "/assets",
        '@/assets': SRC_DIR + "/assets",
        '@pages': SRC_DIR + "/pages",
        '@/pages': SRC_DIR + "/pages"
      },
    },
    server: {
      host: true,
      https: true,
      port : 3002,
    },
    esbuild: {
      jsxFactory: '$jsx',
      jsxFragment: '"Fragment"',
      target: 'es2022',
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'es2022',
      },
    },
  }
})
