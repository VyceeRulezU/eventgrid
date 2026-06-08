import fs from 'fs'

const logPath = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\be3d301d-5433-423e-9af6-691167c0afba\\.system_generated\\logs\\transcript.jsonl'
const content = fs.readFileSync(logPath, 'utf8')
const lines = content.split('\n')

lines.forEach((line, index) => {
  if (!line.trim()) return
  try {
    const obj = JSON.parse(line)
    const str = JSON.stringify(obj)
    if (str.includes('Event not found')) {
      console.log(`Line ${index}: type=${obj.type}, source=${obj.source}`)
      console.log(str.slice(0, 1000))
      console.log('---')
    }
  } catch (e) {
  }
})
