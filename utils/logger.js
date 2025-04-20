const colors = require('ansi-colors');

function logEvent(level, msg, obj) {
  const prefix = {
    info:  colors.cyan('[INFO]'),
    warn:  colors.yellow('[WARN]'),
    error: colors.red('[ERROR]')
  }[level] || colors.white('[LOG]');
  
  console.log(`${new Date().toISOString()} ${prefix} ${msg}`, obj || '');
}

module.exports = { logEvent };
