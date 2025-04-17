// utils/logger.js
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const LOG_PATH = path.resolve(__dirname, '../logs/app.log');

/**
 * Append a log line and also print to console with color.
 * @param {'info'|'warn'|'error'} level 
 * @param {string} message 
 */
function logEvent(level, message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

  // Append to log file
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.appendFileSync(LOG_PATH, line);

  // Console color
  switch (level) {
    case 'info':
      console.log(chalk.blue(line.trim()));
      break;
    case 'warn':
      console.log(chalk.yellow(line.trim()));
      break;
    case 'error':
      console.log(chalk.red(line.trim()));
      break;
    default:
      console.log(line.trim());
  }
}

module.exports = { logEvent };
