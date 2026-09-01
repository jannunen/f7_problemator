import path from 'path'
import framework7 from 'rollup-plugin-framework7'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import loadVersion from 'vite-plugin-package-version';
import EnvironmentPlugin from 'vite-plugin-environment'

const fs = require('node:fs');
const { execSync } = require('node:child_process');

const SRC_DIR = path.resolve(__dirname, './src')
const PUBLIC_DIR = path.resolve(__dirname, './public')
const BUILD_DIR = path.resolve(__dirname, './www')

/**
 * `git rev-parse --short HEAD`, baked in at build time as a build stamp (see
 * src/js/buildInfo.js) — package.json's version is bumped by hand and every
 * build in between looked identical, so nothing told a deploy apart from the
 * one before it. A build with no `.git` around — a tarball, an image with no
 * git installed — has nothing to report: null here, never a build failure.
 */
function gitShortSha() {
  try {
    return execSync('git rev-parse --short=7 HEAD').toString().trim() || null
  } catch {
    return null
  }
}

export default defineConfig(({ command, mode }) => {
  process.env = {...process.env, ...loadEnv(mode, process.cwd())}
  return {
    plugins: [ EnvironmentPlugin('all', {prefix : 'VITE_'}),loadVersion(), basicSsl(), vue(), framework7({ emitCss: false })],
    root: SRC_DIR,
    base: '',
    define: {
      'import.meta.env.BUILD_SHA': JSON.stringify(gitShortSha()),
    },
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
      // Fail rather than quietly move to 3003 when 3002 is taken — usually by
      // a dev server left running from yesterday. A second instance on
      // another port used to start fine and then break on first navigation,
      // which is a much worse way to find out.
      strictPort: true,
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
