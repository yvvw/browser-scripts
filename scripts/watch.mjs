import childProcess from 'node:child_process'
import path from 'node:path'

import chokidar from 'chokidar'

chokidar.watch('src/*.ts').on('change', (p) => {
  const dist = path.resolve(process.cwd(), 'dist/' + p.slice(4).slice(0, -3) + '.js')
  console.log(`${new Date().toISOString()} ${dist}`)
  childProcess.spawn(`node scripts/build.mjs ${p} --dev`, { shell: true, stdio: 'inherit' })
})
