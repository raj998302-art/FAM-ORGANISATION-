const http = require('http');
http.get('http://127.0.0.1:3000', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'DATA:', data.substring(0, 500)));
}).on('error', (err) => console.log('Error:', err.message));
