// Convert data.tsv into data.json
const run = async (destroy) => {
  const fs = require('fs');

  try {
    destroy && fs.unlinkSync('./data.json');
  } catch (error) {  
  }

  const data = fs.readFileSync('./data.tsv', 'utf8');
  const lines = data.split('\n');
  const headers = lines.shift().split('\t')

  const json = lines.map(line => {
    const values = line.split('\t');
    const obj = {};
    headers.forEach((header, i) => {
      // Remove \r
      values[i] = values[i].replaceAll(/\r/g, '');
      const newHeader = header.replaceAll(/\r/g, '');
      obj[newHeader] = values[i];
    });
    return obj;
  });

  fs.writeFileSync('./data.json', JSON.stringify(json));
}

run(true);