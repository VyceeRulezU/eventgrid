import fs from 'fs'

const logPath = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\fbc47cb2-b2b7-4640-a994-2bbf1293619f\\.system_generated\\logs\\transcript.jsonl'

if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf8')
  const lines = content.split('\n')
  lines.forEach((line) => {
    if (line.includes('dbPassword =') || line.includes('connStr =')) {
      const match = line.match(/"(dbPassword|connStr)":\s*"([^"]+)"/)
      if (match) {
        console.log(match[0])
      } else {
        // Just print the matching section
        const idx = line.indexOf('dbPassword')
        if (idx !== -1) {
          console.log(line.slice(idx - 50, idx + 100))
        }
      }
    }
  })
} else {
  console.log('No log file')
}
