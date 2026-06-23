import fs from 'fs'

const logPath = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\fbc47cb2-b2b7-4640-a994-2bbf1293619f\\.system_generated\\logs\\transcript.jsonl'
const content = fs.readFileSync(logPath, 'utf8')
const lines = content.split('\n')

lines.forEach((line, index) => {
  if (!line.trim()) return
  const lower = line.toLowerCase()
  if (lower.includes('apply_migration') || lower.includes('database connection') || lower.includes('migration executed') || lower.includes('successfully connected') || lower.includes('pgpass') || lower.includes('password failed')) {
    console.log(`Line ${index}:`)
    console.log(line.slice(0, 1000))
    console.log('---')
  }
})
