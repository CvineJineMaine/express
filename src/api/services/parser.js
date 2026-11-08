const puppeteer = require('puppeteer');

async function runParser(url) {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(url);

    try {
        await page.waitForSelector('h1');


        const sectionSelector = '.similar-colors-products__section-container';
        await page.waitForSelector(sectionSelector, { timeout: 5000 });
        const totalSelector = await page.$$eval(sectionSelector, sections => sections.length);

        console.log('Знайдено + '+ totalSelector + ' параметрів товару.');

        const allVariantData = [];
          for(let i = 0; i < totalSelector; i++){
            const section = await page.$$(sectionSelector);
            const currentSection = section[i];
            // console.log(currentSection);

            if(!currentSection) continue;

            const isActive = await currentSection.evaluate(el => el.classList.contains('similar-colors-products__section-container--active'));

            if(!isActive){
                try{
                    await currentSection.click({delay: 100});
                    await page.waitForFunction(
                        (index) => {
                            const container = document.querySelectorAll('.similar-colors-products__section-container--active')[index];
                            const list = container?.querySelector('.similar-series-products__list');
                            return list && list.offsetParent !== null;
                        },{
                            timeout: 5000
                        },
                        i
                    );
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch(e){
                    console.log('Помилка при кліку на секцію ' + i + ':  ', e.message);
                    continue;
                }
                
            }
            const sectionData = await page.evaluate((index) => {
                const container = document.querySelectorAll('.similar-colors-products__section-container')[index];

                const groupTitleEl = container.querySelector('.similar-colors-products__section > span');
                const groupName = groupTitleEl ? groupTitleEl.textContent.trim() : 'Назва групи не знайдена';

                const links = [];

                const linkElements = container.querySelectorAll('.similar-series-products__list a');

                linkElements.forEach(linkEl => {
                    links.push({
                        text: linkEl.textContent.trim(),
                        url: linkEl.href,
                        isActive: linkEl.classList.contains('similar-series-products__item--active')
                    })
                })

                return {
                    groupName,
                    options: links
                }
            }, i);
            allVariantData.push(sectionData);
        }

        
        const data = await page.evaluate(() => {
            const title = document.querySelector('.title__main').textContent.trim();
            const lineElement = document.querySelector('.line');

            const line = lineElement ? lineElement.querySelector('a').textContent.trim() : 'Продуктова лінійка не знайдена';

            let minPrice = 0;
            let maxPrice = 0;
            const priceElement = document.querySelector('.many__price-sum');
            if (priceElement) {
                const minEl = priceElement.querySelector('span:nth-child(1) > span');
                const maxEl = priceElement.querySelector('span:nth-child(3) > span');

                if (minEl){
                    minPrice = Number(minEl.textContent.replace(/\s/g, ''));
                    maxPrice = Number(maxEl.textContent.replace(/\s/g, ''));
                } else {
                    minPrice = Number(priceElement.textContent.replace(/\s/g, ''));
                }
            }

            return { 
                product: line, 
                fullNameOfProduct:title,
                priceRange: { 
                    min: minPrice, 
                    max: maxPrice == 0 ? minPrice : maxPrice
                }
            };
        })
         const result = {
            ...data,
            variants: allVariantData
        }
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Error parsing the page:', error);
    } finally {
        await browser.close();
    }







}

runParser('https://hotline.ua/ua/mobile-mobilnye-telefony-i-smartfony/apple-iphone-18-pro-256gb-burgundy/')