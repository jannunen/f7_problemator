import { defineConfig } from 'vitest/config'

/**
 * Separate from vite.config.js on purpose: that one sets `root: 'src'` for the
 * app build, which made Vitest look for tests under src/ and find none.
 */
export default defineConfig({
  test: {
    root: '.',
    include: ['test/**/*.test.js'],
    environment: 'node',
  },
})
