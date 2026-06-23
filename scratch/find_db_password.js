import fs from 'fs'
import path from 'path'

const logPath = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\fbc47cb2-b2b7-4640-a994-2bbf1293619f\\.system_generated\\logs\\transcript.jsonl'

if (!fs.existsSync(logPath)) {
  console.log('Transcript file does not exist at:', logPath)
  process.exit(1)
}

const content = fs.readFileSync(logPath, 'utf8')
const lines = content.split('\n')
console.log(`Searching through ${lines.length} transcript lines...`)

lines.forEach((line, index) => {
  if (!line.trim()) return
  if (line.includes('postgresql://') || line.includes('aws-0-eu-west-1.pooler.supabase.com') || line.includes('connStr')) {
    console.log(`Line ${index}:`)
    console.log(line.slice(0, 1000))
    console.log('---')
  }
})
