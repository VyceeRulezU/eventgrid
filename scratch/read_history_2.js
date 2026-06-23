import fs from 'fs'
import path from 'path'
import os from 'os'

const historyPath = path.join(
  os.homedir(),
  'AppData',
  'Roaming',
  'Microsoft',
  'Windows',
  'PowerShell',
  'PSReadLine',
  'ConsoleHost_history.txt'
)

if (fs.existsSync(historyPath)) {
  const content = fs.readFileSync(historyPath, 'utf8')
  const lines = content.split('\n')
  console.log(`Searching through ${lines.length} lines of history...`)
  lines.forEach((line, idx) => {
    const l = line.toLowerCase()
    if (l.includes('menmpyyrqev') || l.includes('eventgrid') || l.includes('db push') || l.includes('db pull') || l.includes('link') || l.includes('secret')) {
      console.log(`${idx + 1}: ${line.trim()}`)
    }
  })
} else {
  console.log('No history file.')
}
