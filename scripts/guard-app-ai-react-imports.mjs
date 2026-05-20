/**
 * Ensures React hook names invoked in AppAIPage are imported from 'react'
 * (catches ReferenceError: useMemo is not defined when import line is missing a name).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const target = path.join(root, 'src/components/app/pages/AppAIPage.tsx')

const src = fs.readFileSync(target, 'utf8')

/** @type {Map<string, Set<string>>} */
const namedBySpecifier = new Map()

const importBlockRe =
  /^import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]\s*;?/gm

for (const m of src.matchAll(importBlockRe)) {
  const body = m[1]
  const spec = m[2]
  const names = new Set()
  for (const part of body.split(',')) {
    const seg = part.trim()
    if (!seg) continue
    const asMatch = seg.match(/^(.+?)\s+as\s+(.+)$/)
    const local = (asMatch ? asMatch[2] : seg).trim()
    if (local) names.add(local)
  }
  namedBySpecifier.set(spec, names)
}

const reactNamed = namedBySpecifier.get('react') ?? new Set()

const useCallRe = /\b(use[A-Z][a-zA-Z0-9]*)\s*\(/g
const used = new Set()
for (const m of src.matchAll(useCallRe)) {
  used.add(m[1])
}

const reactHooks = [...used].filter((name) => {
  if (!name.startsWith('use')) return false
  for (const [spec, set] of namedBySpecifier) {
    if (spec === 'react') continue
    if (set.has(name)) return false
  }
  return true
})

const missing = reactHooks.filter((name) => !reactNamed.has(name))

if (missing.length) {
  console.error(
    `[guard-app-ai-react-imports] ${path.relative(root, target)}: ` +
      `call(s) ${missing.join(', ')} but not in import { … } from 'react'. ` +
      `Add: import { ${missing.join(', ')} } from 'react' (merge with existing named imports).`
  )
  process.exit(1)
}

/**
 * DashboardHeader / AppHeader call useAiPageChromeMobileToolbar from AiPageChromeContext — must import it.
 */
function assertAiChromeToolbarHookImported(relativePath) {
  const full = path.join(root, relativePath)
  if (!fs.existsSync(full)) return
  const s = fs.readFileSync(full, 'utf8')
  if (!/\buseAiPageChromeMobileToolbar\s*\(/.test(s)) return
  const ok = /import\s*\{[^}]*\buseAiPageChromeMobileToolbar\b[^}]*\}\s*from\s*['"][^'"]*AiPageChromeContext['"]/.test(
    s
  )
  if (!ok) {
    console.error(
      `[guard-app-ai-react-imports] ${relativePath}: uses useAiPageChromeMobileToolbar() but has no ` +
        `import { useAiPageChromeMobileToolbar } from '…/AiPageChromeContext' (or @/contexts/AiPageChromeContext).`
    )
    process.exit(1)
  }
}

assertAiChromeToolbarHookImported('src/components/DashboardHeader.tsx')
assertAiChromeToolbarHookImported('src/components/app/AppHeader.tsx')

console.log('[guard-app-ai-react-imports] OK — AppAIPage React hooks + Ai chrome toolbar imports.')
