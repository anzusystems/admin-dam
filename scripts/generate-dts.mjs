/**
 * Generates the typed-router declaration file by briefly running a Vite build, which triggers the plugin hooks.
 * Used in CI before type-checking and linting.
 * It also deletes old unplugin-auto-import output. Those files are gitignored, so an existing clone
 * keeps them, and the stale globals in `src/auto-imports.d.ts` would hide missing imports from vue-tsc.
 */
import { existsSync, rmSync } from 'node:fs'

import { build } from 'vite'

const autoImportFiles = ['../src/auto-imports.d.ts', '../.eslintrc-auto-import.json'].map(
  (file) => new URL(file, import.meta.url)
)
autoImportFiles.forEach((file) => rmSync(file, { force: true }))

await build({
  build: {
    write: false,
    rollupOptions: {
      onLog() {},
    },
  },
  logLevel: 'warn',
})

if (autoImportFiles.some((file) => existsSync(file))) {
  throw new Error(
    'src/auto-imports.d.ts or .eslintrc-auto-import.json was generated again: is unplugin-auto-import back?'
  )
}
