import fs from 'fs';
import readline from 'readline';
import { Transform } from 'stream';
import { parseString } from 'xml2js';

function logMemoryUsage() {
    const used = process.memoryUsage();
    console.log(`Memory usage: 
        heapTotal: ${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB,
        heapUsed: ${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB,
        external: ${Math.round(used.external / 1024 / 1024 * 100) / 100} MB`);
}

export function readXmlFile(filePath) {
  return new Promise((resolve, reject) => {
    logMemoryUsage();
    console.log('Чтение файла начато.');

    const readStream = fs.createReadStream(filePath, 'utf8');
    const rl = readline.createInterface({
      input: readStream,
      crlfDelay: Infinity
    });

    let xmlBuffer = '';

    rl.on('line', line => {
      xmlBuffer += line;

      if (xmlBuffer.includes('<urlset>')) {
        console.log('Обнаружен начальный тег <urlset>. Начат разбор XML.');
        logMemoryUsage();
        const xmlParser = new Transform({
          transform(chunk, encoding, callback) {
            parseString(chunk.toString(), (err, result) => {
              if (err) {
                reject(err);
              } else {
                const urls = result.urlset.url.map(url => url.loc[0]);
                resolve(urls);
              }
            });
            callback();
          }
        });

        xmlParser.write(`${xmlBuffer}\n`);
        xmlBuffer = '';
      }
    });

    rl.on('close', () => {
      console.log('Чтение файла завершено.');
      logMemoryUsage();
      if (xmlBuffer && xmlBuffer.includes('<urlset>')) {
        console.log('Обнаружен начальный тег <urlset>. Начат разбор XML.');
        logMemoryUsage();
        const xmlParser = new Transform({
          transform(chunk, encoding, callback) {
            parseString(chunk.toString(), (err, result) => {
              if (err) {
                reject(err);
              } else {
                const urls = result.urlset.url.map(url => url.loc[0]);
                resolve(urls);
              }
            });
            callback();
          }
        });

        xmlParser.write(`${xmlBuffer}\n`);
      }

      xmlBuffer = '';
    });

    rl.on('error', err => {
      reject(err);
    });

    // Вызываем logMemoryUsage каждую секунду
    const intervalId = setInterval(logMemoryUsage, 1000);

    // Останавливаем интервал после завершения чтения файла
    rl.on('close', () => {
      clearInterval(intervalId);
    });
  });
}
