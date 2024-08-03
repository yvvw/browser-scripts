import chokidar from 'chokidar'
import childProcess from 'node:child_process'

chokidar.watch('src/*.ts').on('change', (path) => {
  console.log(`${new Date().toISOString()} ${path}`)
  const command = `node scripts/build.mjs ${path} --dev`
  childProcess.spawn(command, { shell: true, stdio: 'inherit' })
})
