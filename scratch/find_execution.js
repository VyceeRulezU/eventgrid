import fs from 'fs'

const logPath = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\fbc47cb2-b2b7-4640-a994-2bbf1293619f\\.system_generated\\logs\\transcript.jsonl'
const content = fs.readFileSync(logPath, 'utf8')
const lines = content.split('\n')

lines.forEach((line, index) => {
  if (!line.trim()) return
  const p = JSON.parse(line)
  const c = p.content || ''
  if (c.includes('authentication failed') || c.includes('Migration executed') || c.includes('Successfully connected')) {
    console.log(`Step ${p.step_index}:`)
    console.log(c.slice(0, 500))
    console.log('---')
  }
})
