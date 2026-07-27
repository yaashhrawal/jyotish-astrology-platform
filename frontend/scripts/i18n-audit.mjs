#!/usr/bin/env node
/**
 * i18n audit — finds strings passed to t('...') (and nav `label:` fields)
 * that have no key in i18n/terms.ts. Run: node scripts/i18n-audit.mjs
 * Exit code 1 if any misses (so it can gate CI).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src')
const I18N = join(SRC, 'i18n')
const TERM_FILES = readdirSync(I18N)
  .filter(f => /\.ts$/.test(f))
  .map(f => join(I18N, f))

// 1. collect existing dictionary keys across ALL i18n/*.ts: lines like  'Key': { en: ...
const have = new Set()
for (const tf of TERM_FILES) {
  const src = readFileSync(tf, 'utf8')
  for (const m of src.matchAll(/^\s*'((?:[^'\\]|\\.)*)':\s*\{\s*en:/gm)) {
    have.add(m[1].replace(/\\'/g, "'"))
  }
}
const TERM_SET = new Set(TERM_FILES)

// 2. walk src for t('...') / t("...") and label: '...'
const wanted = new Map() // key -> Set(files)
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) { if (name !== 'node_modules') walk(p); continue }
    if (!/\.(tsx?|jsx?)$/.test(name)) continue
    if (TERM_SET.has(p)) continue
    const src = readFileSync(p, 'utf8')
    const add = (k) => {
      if (!k || k.length > 80) return
      if (!wanted.has(k)) wanted.set(k, new Set())
      wanted.get(k).add(p.replace(SRC + '/', ''))
    }
    for (const m of src.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'\s*\)/g)) add(m[1].replace(/\\'/g, "'"))
    for (const m of src.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"\s*\)/g)) add(m[1].replace(/\\"/g, '"'))
    for (const m of src.matchAll(/\blabel:\s*'((?:[^'\\]|\\.)*)'/g)) add(m[1].replace(/\\'/g, "'"))
  }
}
walk(SRC)

// 3. report misses
const misses = [...wanted.keys()].filter(k => !have.has(k)).sort()
console.log(`Dictionary keys: ${have.size}`)
console.log(`Distinct t()/label strings: ${wanted.size}`)
console.log(`MISSING: ${misses.length}\n`)
for (const k of misses) {
  console.log(`  "${k}"   ← ${[...wanted.get(k)].slice(0, 3).join(', ')}`)
}
process.exit(misses.length ? 1 : 0)
