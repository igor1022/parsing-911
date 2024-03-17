import puppeteer from 'puppeteer';
import { parseXml } from './urlsDb.js';

async function scrapeApteka911() {
    const urls = await parseXml();
    const browser = await puppeteer.launch();

    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const page = await browser.newPage();
        await page.goto(url);

        // Ждем, пока загрузится содержимое страницы
        await page.waitForSelector('#wrp-content > div.product-head-instr.tl > h1');
        await page.waitForSelector('#main > div.shopping-conteiner > div.b__shopping > div.b-product__shopping.instruction.full > div:nth-child(1) > div > div > div');

        // Извлекаем информацию о товарах
        const productData = await page.evaluate(() => {
            const nameElement = document.querySelector('#wrp-content > div.product-head-instr.tl > h1');
            const name = nameElement.textContent.trim();

            const priceElement = document.querySelector('#main > div.shopping-conteiner > div.b__shopping > div.b-product__shopping.instruction.full > div:nth-child(1) > div > div > div');
            const price = priceElement.textContent.trim();

            return { name, price };
        });

        console.log(productData);

        await page.close();

        // Пауза между запросами
        if (i < urls.length - 1) {
            console.log('Waiting for 10 seconds before the next request...');
            await new Promise(resolve => setTimeout(resolve, 10000)); // Пауза в 10 секунд
        }
    }

    await browser.close();
}

scrapeApteka911();
