import fs from 'fs'

const logPath = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\fbc47cb2-b2b7-4640-a994-2bbf1293619f\\.system_generated\\logs\\transcript.jsonl'
const content = fs.readFileSync(logPath, 'utf8')
const lines = content.split('\n')

lines.forEach((line, index) => {
  if (!line.trim()) return
  if (line.includes('Password') || line.includes('Successfully connected') || line.includes('Migration executed')) {
    // Only print if it's not our own tool output or files we just created
    if (!line.includes('search_password_logs.js') && !line.includes('find_db_password.js')) {
      const parsed = JSON.parse(line)
      console.log(`Line ${index}: type=${parsed.type}, source=${parsed.source}`)
      if (parsed.content) console.log('Content:', parsed.content.slice(0, 500))
      if (parsed.tool_calls) console.log('Tool calls:', JSON.stringify(parsed.tool_calls).slice(0, 500))
      console.log('---')
    }
  }
})
