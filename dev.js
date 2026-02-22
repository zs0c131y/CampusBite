const { spawn, spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const rootDir = __dirname
const isWindows = process.platform === 'win32'
const comspec = process.env.ComSpec || 'cmd.exe'

const services = [
  { name: 'backend', cwd: path.join(rootDir, 'backend') },
  { name: 'frontend', cwd: path.join(rootDir, 'frontend') },
]

const processes = []
let shuttingDown = false

function runNpm(serviceDir, args) {
  const command = isWindows ? comspec : 'npm'
  const commandArgs = isWindows
    ? ['/d', '/s', '/c', `npm ${args.join(' ')}`]
    : args

  return spawnSync(command, commandArgs, {
    cwd: serviceDir,
    stdio: 'inherit',
    env: process.env,
  })
}

function ensureDependencies(service) {
  const nodeModulesPath = path.join(service.cwd, 'node_modules')
  if (fs.existsSync(nodeModulesPath)) return true

  console.log(`[${service.name}] dependencies not found. Running npm install...`)
  const result = runNpm(service.cwd, ['install'])

  if (result.status !== 0) {
    console.error(`[${service.name}] npm install failed.`)
    return false
  }

  return true
}

function stopAll(exitCode = 0) {
  if (shuttingDown) return
  shuttingDown = true

  for (const proc of processes) {
    if (proc && !proc.killed) {
      try {
        proc.kill()
      } catch {
        // Best-effort shutdown.
      }
    }
  }

  setTimeout(() => process.exit(exitCode), 150)
}

for (const service of services) {
  if (!ensureDependencies(service)) {
    process.exit(1)
  }
}

for (const service of services) {
  const command = isWindows ? comspec : 'npm'
  const args = isWindows
    ? ['/d', '/s', '/c', 'npm run dev']
    : ['run', 'dev']
  const child = spawn(command, args, {
    cwd: service.cwd,
    stdio: 'inherit',
    env: process.env,
  })

  child.on('error', (err) => {
    console.error(`[${service.name}] failed to start:`, err.message)
    stopAll(1)
  })

  child.on('exit', (code) => {
    if (!shuttingDown) {
      const exitCode = typeof code === 'number' ? code : 1
      console.error(`[${service.name}] exited with code ${exitCode}`)
      stopAll(exitCode)
    }
  })

  processes.push(child)
}

process.on('SIGINT', () => stopAll(0))
process.on('SIGTERM', () => stopAll(0))
