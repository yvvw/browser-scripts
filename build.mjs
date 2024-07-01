import * as esbuild from 'esbuild'
import { open, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

async function main() {
  await mkdir('dist')

  const entry = parseEntry()
  const banner = await parseBanner(entry.path)
  await Promise.all([
    esbuild.build({
      entryPoints: [entry.path],
      banner: {
        js: banner,
      },
      outfile: `dist/${entry.object.name}.user.js`,
      bundle: true,
      minify: true,
      target: ['es2015'],
      legalComments: 'none',
    }),
    writeFile(`dist/${entry.object.name}.meta.js`, banner),
  ])
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
