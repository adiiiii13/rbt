const fs = require('fs');
const content = fs.readFileSync('temp.js', 'utf8');
const match = content.match(/apiKey:.*?(?=\})/is);
if (match) {
  console.log('Found:', match[0]);
} else {
  console.log('Not found');
}
