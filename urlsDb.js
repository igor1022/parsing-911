import { parseString } from 'xml2js';
import { readFile } from 'fs/promises'; 

const readXmlFile = async () => {
    try {
        const file = await readFile('./sitemap.xml', 'utf8');
        return file;
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
};

export const parseXml = async () => {
    try {
        const xmlData = await readXmlFile();
        const result = await new Promise((resolve, reject) => {
            parseString(xmlData, (err, res) => {
                if (err) reject(err);
                resolve(res);
            });
        });
        const urls = result.urlset.url.map(url => url.loc[0]);
        return urls;
    } catch (error) {
        console.error('Error parsing XML:', error);
    }
};

