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
        let urls = result.urlset.url.map(url => url.loc[0]);
        const shopUrls = {};
        urls.forEach(url => {
            const shopIndex = url.indexOf('/shop/');
            if (shopIndex !== -1) {
                const shopUrl = url.substring(shopIndex + 6); // +6 to skip '/shop/'
                shopUrls[shopUrl] = url;
            }
        });
        return Object.values(shopUrls);
    } catch (error) {
        console.error('Error parsing XML:', error);
        throw error;
    }
};

