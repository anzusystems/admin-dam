#!/usr/bin/env node
// Fails the build when the browser data behind browserslist has gone stale.
// browserslist only prints a warning at six months, which is how this data once
// went a year without anyone noticing. Same threshold and same measure as its own
// oldDataWarning, except that BROWSERSLIST_IGNORE_OLD_DATA silences that one
// and not this - and this stops the build instead of scrolling past in the log.
import browserslist from 'browserslist'

const MAX_MONTHS = 6

let latestSeconds = 0
for (const browser of Object.values(browserslist.data)) {
  for (const seconds of Object.values(browser?.releaseDate ?? {})) {
    if (typeof seconds === 'number' && seconds > latestSeconds) latestSeconds = seconds
  }
}

if (latestSeconds === 0) {
  console.warn('check-browserslist: no release dates in the browser data, skipping')
  process.exit(0)
}

const latest = new Date(latestSeconds * 1000)
const now = new Date()
const months = (now.getFullYear() - latest.getFullYear()) * 12 + (now.getMonth() - latest.getMonth())
const newest = latest.toISOString().slice(0, 10)

if (months >= MAX_MONTHS) {
  console.error(
    `caniuse-lite is ${months} months old (newest browser release in the data: ${newest}).\n` +
      'Run `yarn browserslist:update`, then commit package.json and yarn.lock.'
  )
  process.exit(1)
}

console.log(`caniuse-lite is current (${months} month(s) old, newest browser release ${newest}, limit ${MAX_MONTHS}).`)
