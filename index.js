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
        productsWorksheet = xlsx.utils.aoa_to_sheet([['Ean', 'Name', 'Price']]);
        xlsx.utils.book_append_sheet(workbook, productsWorksheet, 'Products');
    }

    const addProductToWorksheet = (worksheet, product) => {
        const lastRowIndex = worksheet['!ref'] ? xlsx.utils.decode_range(worksheet['!ref']).e.r : 0;
        const nextRowIndex = lastRowIndex + 1;
    
        // Создаем массив данных
        const data = [[product.ean, product.name, product.price]];
    
        // Добавляем данные в лист
        xlsx.utils.sheet_add_aoa(worksheet, data, { origin: { r: nextRowIndex, c: 0 } });
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
        await page.waitForSelector('#wrp-content > div.product-head-instr.tl > span');

        // Извлекаем информацию о товарах
        const productData = await page.evaluate(() => {
            const nameElement = document.querySelector('#wrp-content > div.product-head-instr.tl > h1');
            const name = nameElement.textContent.trim();

            const eanElement = document.querySelector('#wrp-content > div.product-head-instr.tl > span');
            let eanText = eanElement.textContent.trim();

            // Извлекаем числовое значение штрихкода из текста
            const eanMatch = eanText.match(/(\d+)/);
            const ean = eanMatch ? parseInt(eanMatch[0]) : null;
        
            const priceElement = document.querySelector('#main > div.shopping-conteiner > div.b__shopping > div.b-product__shopping.instruction.full > div:nth-child(1) > div > div > div');
            let priceText = priceElement.textContent.trim();
        
            // Извлекаем числовое значение цены из текста
            const priceMatch = priceText.match(/(\d+(\.\d+)?)/);
            const price = priceMatch ? parseFloat(priceMatch[0]) : null;
        
            return { ean, name, price };
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
