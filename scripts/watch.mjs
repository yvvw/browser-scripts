import chokidar from 'chokidar'
import childProcess from 'node:child_process'
import path from 'node:path'

chokidar.watch('src/*.ts').on('change', (_path) => {
  const name = path.parse(_path).name
  const script = `npm_package_scripts_build_${name}`
  if (script in process.env) {
    console.log(`${new Date().toISOString()} ${name}`)
    childProcess.spawn(process.env[script], { shell: true, stdio: 'inherit' })
  }
})
