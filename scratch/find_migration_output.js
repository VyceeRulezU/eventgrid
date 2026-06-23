import fs from 'fs'

const logPath = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\fbc47cb2-b2b7-4640-a994-2bbf1293619f\\.system_generated\\logs\\transcript.jsonl'

if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf8')
  const lines = content.split('\n')
  lines.forEach((line) => {
    if (line.includes('apply_migration.js') && line.includes('Output')) {
      console.log(line.slice(0, 1000))
    }
  })
}
