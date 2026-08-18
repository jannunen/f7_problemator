import { defineConfig } from 'vitest/config'
import path from 'path'

const SRC_DIR = path.resolve(__dirname, './src')

/**
 * Separate from vite.config.js on purpose: that one sets `root: 'src'` for the
 * app build, which made Vitest look for tests under src/ and find none.
 *
 * The aliases mirror vite.config.js so modules under test can import the same
 * way the app does.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': SRC_DIR,
      '@js': path.join(SRC_DIR, 'js'),
      '@helpers': path.join(SRC_DIR, 'js/helpers'),
      '@components': path.join(SRC_DIR, 'components'),
    },
  },
  test: {
    root: '.',
    include: ['test/**/*.test.js'],
    environment: 'node',
  },
})
