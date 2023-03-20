import { open, writeFile } from 'node:fs/promises'
import path from 'node:path'

import * as esbuild from 'esbuild'

async function main() {
  const entry = parseEntry()
  const banner = await parseBanner(entry)
  await esbuild.build({
    entryPoints: [entry.path],
    banner: { js: banner },
    outfile: `dist/${entry.object.name}.js`,
    loader: { '.wgsl': 'text' },
    bundle: true,
    minify: true,
    target: ['es2020', 'chrome57', 'firefox57'],
    legalComments: 'none',
  })
  if (!entry.dev) {
    await writeFile(`dist/${entry.object.name.replace('user', 'meta')}.js`, banner)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

function parseEntry() {
  const index = process.argv.findIndex((it) => it.endsWith('build.mjs')) + 1
  if (process.argv.length === index) throw new Error('no entry.')
  const entry = path.parse(process.argv[index])
  return {
    object: entry,
    path: path.join(entry.dir, entry.base),
    dev: process.argv.includes('--dev'),
  }
}

async function parseBanner(entry) {
  const fd = await open(entry.path)
  const bannerLines = []
  for await (let line of fd.readLines()) {
    line = line.trim()
    if (line === '// ==UserScript==' || bannerLines.length > 0) bannerLines.push(line)
    if (line === '// ==/UserScript==') break
  }
  await fd.close()
  return bannerLines.length > 0 ? `${bannerLines.join('\n')}\n` : ''
}
