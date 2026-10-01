const { exec } = require('child_process');
exec('netstat -ano | findstr :8000', (err, stdout) => {
  console.log('PORT 8000 STATUS:');
  console.log(stdout || 'NOT LISTENING');
});
exec('netstat -ano | findstr :517', (err, stdout) => {
  console.log('PORT 517x STATUS:');
  console.log(stdout || 'NOT LISTENING');
});
