const { parseString } = require('xml2js');
const fs = require('fs').promises; 

const readXmlFile = async () => {
    try {
        const file = await fs.readFile('./sitemap.xml', 'utf8');
        return file;
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
};

const parseXml = async () => {
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

export default parseXml;
