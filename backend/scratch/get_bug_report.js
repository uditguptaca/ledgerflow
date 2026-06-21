const fs = require('fs');
const lines = fs.readFileSync('C:/Users/uditg/.gemini/antigravity/brain/a116acf1-b5d8-4c86-b03d-e0ef1546cd4f/.system_generated/logs/transcript_full.jsonl', 'utf8').split('\n');
for (const line of lines) {
  if (line.trim()) {
    try {
      const obj = JSON.parse(line);
      if (obj.step_index === 2039) {
        fs.writeFileSync('C:/Users/uditg/.gemini/antigravity/brain/a116acf1-b5d8-4c86-b03d-e0ef1546cd4f/scratch/bug_report.txt', obj.content);
        console.log('Success writing bug report!');
        break;
      }
    } catch (e) {
      // ignore
    }
  }
}
