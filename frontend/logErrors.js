const fs = require('fs');
const logFile = 'error.log';

process.on('uncaughtException', err => {
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] Uncaught Exception: ${err.stack}\n`);
});

process.on('unhandledRejection', (reason, promise) => {
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] Unhandled Rejection: ${reason}\n`);
});
