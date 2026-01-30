
import fs from 'fs';
import path from 'path';
import util from 'util';

// This is a server-side only logger. It will create a 'logs' directory
// in your project root and write to 'app.log'.

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFilePath = path.join(logDir, 'app.log');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

const logToFile = (level: string, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
            return util.inspect(arg, { depth: null, colors: false });
        }
        return arg;
    }).join(' ');

    logStream.write(`${timestamp} [${level.toUpperCase()}] ${message}\n`);
};

export const logger = {
  log: (...args: any[]) => {
    console.log(...args);
    logToFile('INFO', ...args);
  },
  error: (...args: any[]) => {
    console.error(...args);
    logToFile('ERROR', ...args);
  },
  warn: (...args: any[]) => {
    console.warn(...args);
    logToFile('WARN', ...args);
  }
};
