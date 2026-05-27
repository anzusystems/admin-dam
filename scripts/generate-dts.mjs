/**
 * Generates the typed-router declaration file
 * by briefly running a Vite build (triggers plugin hooks).
 *
 * Used in CI before type-checking and linting.
 */
import { build } from 'vite'

await build({
  build: {
    write: false,
    rollupOptions: {
      onLog() {},
    },
  },
  logLevel: 'warn',
})
