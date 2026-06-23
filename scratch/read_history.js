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

console.log('Checking history file:', historyPath)
if (fs.existsSync(historyPath)) {
  const content = fs.readFileSync(historyPath, 'utf8')
  const lines = content.split('\n')
  console.log(`Found history file with ${lines.length} lines. Searching...`)
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes('password') || 
        line.toLowerCase().includes('supabase') || 
        line.toLowerCase().includes('postgres') ||
        line.toLowerCase().includes('db_') ||
        line.toLowerCase().includes('database')) {
      console.log(`${idx + 1}: ${line.trim()}`)
    }
  })
} else {
  console.log('History file does not exist.')
}
