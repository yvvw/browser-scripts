import * as esbuild from 'esbuild'
import { open } from 'fs/promises'
import path from 'node:path'

async function main() {
  const entry = parseEntry()

  await esbuild.build({
    entryPoints: [entry.path],
    banner: {
      js: await parseBanner(entry.path),
    },
    outfile: `dist/${entry.object.name}.user.js`,
    bundle: true,
    minify: true,
    target: ['es2015'],
    legalComments: 'none',
  })
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
  }
}

async function parseBanner(file) {
  const fd = await open(file)
  const bannerLines = []
  for await (let line of fd.readLines()) {
    line = line.trim()
    if (line === '// ==UserScript==' || bannerLines.length > 0) bannerLines.push(line)
    if (line === '// ==/UserScript==') break
  }
  await fd.close()
  return bannerLines.length > 0 ? `${bannerLines.join('\n')}\n` : ''
}
