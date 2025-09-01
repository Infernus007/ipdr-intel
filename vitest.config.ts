import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: ['**/*.test.ts', '**/*.test.tsx'],
    css: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  },
  esbuild: {
    jsxInject: `import React from 'react'`
  }
});


