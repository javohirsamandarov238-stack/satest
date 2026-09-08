/**
 * Bundles dist/ into a portable folder that runs from the filesystem with no
 * server. CSS, JS and the Reading and Writing figures are inlined into one
 * HTML file; the 427 rendered math questions are copied alongside it, because
 * inlining 12 MB of images would make the page slow to open on a phone.
 *
 * Usage: npm run standalone   →  standalone/sat-practice.html + standalone/figures/math/
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, cpSync, statSync } from 'node:fs'
import { join } from 'node:path'

const dist = 'dist'
// `node build-standalone.mjs flat` emits a single HTML file that expects the
// math images in a sibling `math/` folder instead of `figures/math/`.
const flat = process.argv[2] === 'flat'
const out = flat ? 'standalone-flat' : 'standalone'

let html = readFileSync(join(dist, 'index.html'), 'utf8')
const assets = readdirSync(join(dist, 'assets'))
const cssText = readFileSync(join(dist, 'assets', assets.find((f) => f.endsWith('.css'))), 'utf8')
const jsText = readFileSync(join(dist, 'assets', assets.find((f) => f.endsWith('.js'))), 'utf8')

// Inline only the top-level figures; math/ is copied as files.
const figs = {}
for (const f of readdirSync(join(dist, 'figures'))) {
  const p = join(dist, 'figures', f)
  if (statSync(p).isDirectory()) continue
  figs[f] = 'data:image/png;base64,' + readFileSync(p).toString('base64')
}

// Replacer functions, never strings: the bundle contains "$&" sequences that
// String.replace would otherwise expand into the matched tag and corrupt it.
html = html
  .replace(/<link rel="modulepreload"[^>]*>/g, () => '')
  .replace(/<link rel="stylesheet"[^>]*assets\/[^>]*>/, () => `<style>${cssText}</style>`)
  .replace(
    /<script type="module"[^>]*><\/script>/,
    () =>
      `<script>window.__FIGS=${JSON.stringify(figs)}` +
      (flat ? `;window.__FIGROOT="./"` : '') +
      `</script>\n<script type="module">${jsText}</script>`
  )

mkdirSync(join(out, flat ? 'math' : 'figures'), { recursive: true })
writeFileSync(join(out, 'sat-practice.html'), html)
cpSync(join(dist, 'figures', 'math'), join(out, flat ? 'math' : join('figures', 'math')), {
  recursive: true,
})

const mathCount = readdirSync(join(out, flat ? 'math' : join('figures', 'math'))).length
console.log(`${out}/sat-practice.html  ${(html.length / 1e6).toFixed(1)} MB (${Object.keys(figs).length} figures inlined)`)
console.log(`${out}/${flat ? "math" : "figures/math"}/      ${mathCount} images`)
