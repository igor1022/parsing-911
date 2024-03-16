const puppeteer = require('puppeteer');

async function scrapeApteka911() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://apteka911.ua/ua/shop/fitochay-islandskiy-moh-30-g-solution-pharm-p262912');

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

    await browser.close();
}

scrapeApteka911();
