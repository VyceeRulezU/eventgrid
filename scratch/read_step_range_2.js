import fs from 'fs'

const logPath = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\fbc47cb2-b2b7-4640-a994-2bbf1293619f\\.system_generated\\logs\\transcript.jsonl'
const content = fs.readFileSync(logPath, 'utf8')
const lines = content.split('\n')

lines.forEach((line, index) => {
  if (!line.trim()) return
  const parsed = JSON.parse(line)
  if (parsed.step_index >= 755 && parsed.step_index <= 780) {
    console.log(`Step ${parsed.step_index}: type=${parsed.type}, source=${parsed.source}`)
    if (parsed.content) console.log('Content:', parsed.content.slice(0, 1000))
    if (parsed.tool_calls) console.log('Tool calls:', JSON.stringify(parsed.tool_calls))
    console.log('---')
  }
})
