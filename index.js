import puppeteer from 'puppeteer';
import { parseXml } from './urlsDb.js';
import xlsx from 'xlsx';
import fs from 'fs';

async function scrapeApteka911() {
    const urls = await parseXml();
    const browser = await puppeteer.launch();

    const filePath = 'products.xlsx';
    let workbook;

    try {
        workbook = xlsx.readFile(filePath);
    } catch (error) {
        workbook = xlsx.utils.book_new();
    }

    let productsWorksheet = workbook.Sheets['Products'];
    if (!productsWorksheet) {
        productsWorksheet = xlsx.utils.aoa_to_sheet([['Name', 'Price']]);
        xlsx.utils.book_append_sheet(workbook, productsWorksheet, 'Products');
    }

    const addProductToWorksheet = (worksheet, product) => {
        const lastRowIndex = worksheet['!ref'] ? xlsx.utils.decode_range(worksheet['!ref']).e.r : 0;
        xlsx.utils.sheet_add_json(worksheet, [product], { header: ["Name", "Price"], skipHeader: true, origin: lastRowIndex + 1 });
    };

    // Создаем Set для отслеживания уже добавленных названий товаров
    const addedProducts = new Set();

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

        // Проверяем, не добавлено ли уже такое название товара
        if (!addedProducts.has(productData.name)) {
            addProductToWorksheet(productsWorksheet, productData);
            addedProducts.add(productData.name);
            console.log('Data from', url, 'has been added to products.xlsx');
        }

        await page.close();

        // Записываем результаты в файл XLSX
        xlsx.writeFile(workbook, filePath);

        // Пауза между запросами
        if (i < urls.length - 1) {
            console.log('Waiting for 10 seconds before the next request...');
            await new Promise(resolve => setTimeout(resolve, 10000)); // Пауза в 10 секунд
        }
    }

    await browser.close();
}

scrapeApteka911();
