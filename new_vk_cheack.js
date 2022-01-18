const puppeteer = require('puppeteer');

const SEARCHED_LINK = '--M1x9s9NYs';
const LINK_NAME = 'Вайтишный Новогодний стрим - призы, планы на 2022 год'.toLowerCase();
const VK_URL = 'https://vk.com/id4255985?w=wall4255985_144';
const VK_SELECTOR = '.wl_post_body_wrap';

(async () => {
    // const browser = await puppeteer.launch({
    //     devtools: true,
    //     args: [ '--proxy-server=124.156.100.83:8118' ],
    // });
    const browser = await puppeteer.launch({
        args: [ '--proxy-server=https://14.140.131.82:3128', ],
    });
    try {
        let totalBytes = 0;

        const page = await browser.newPage();
        // Добавляем логику подсчета трафика
        page.setRequestInterception(true);
        page.on('request', request => {
            request.continue();
        });
        // Экономим трафик не загружая картинки и css
        // page.on('request', request => {
        //     // if (request.url().endsWith('.png') ||
        //     //     request.url().endsWith('.jpg') ||
        //     //     request.url().endsWith('.jpeg') ||
        //     //     request.url().endsWith('.gif') ||
        //     //     request.url().endsWith('.mp3') ||
        //     //     request.url().endsWith('.css')) {
        //     //     request.abort();
        //     // } else {
        //         request.continue();
        //     }
        //});
        page.on('response', response => {
            let headers = response.headers();
            if ( typeof headers['content-length'] !== 'undefined' ){
                let length = parseInt( headers['content-length'] );
                totalBytes+= length;
            }
        });
        //

        await page.goto(VK_URL, {
            waitUntil: 'networkidle2',
        });
        //await page.waitForTimeout(100);
        //await page.waitForSelector();

        const videoLink = await page.evaluate((VK_SELECTOR, LINK_NAME) => {
            function searchRecursively(elements) {
                const hrefRegex = new RegExp(/\/video\d{1,}_\d{1,}/);
                const links = [];
                elements.forEach(el => {
                    links.push(...el.querySelectorAll('a'));
                });
                console.log(links.length);
                if (links.length === 0) {
                    return null;
                }
                for (let i = 0; i < links.length; i++) {
                    let el = links[i];
                    const ariaLabel = el.getAttribute('aria-label');
                    const linkHref = el.getAttribute('href');
                    if( ariaLabel &&
                        ariaLabel.toLowerCase().includes(LINK_NAME) &&
                        linkHref &&
                        hrefRegex.test(linkHref) ) {
                        return linkHref;
                    }
                }
                return null;
            }

            return searchRecursively([...document.querySelectorAll(VK_SELECTOR)]);
        }, VK_SELECTOR, LINK_NAME);

        console.log('videoLink ', videoLink);
        if(!videoLink) {
            return false;
        }

        const newURL = `https://vk.com${videoLink}`;
        console.log('newURL ', newURL);

        await page.goto(newURL, {
            waitUntil: 'networkidle2',
        });
        debugger
        const isContainsSearchLink = await page.evaluate((SEARCHED_LINK) => {
            function searchRecursively(elements) {
                console.log('elements ', elements);
                debugger
                if (elements.length === 0) {
                    return false;
                }
                for (let i = 0; i < elements.length; i++) {
                    let el = elements[i];
                    console.log('elements[i] ', elements[i]);
                    debugger
                    const linkHref = el.getAttribute('href');

                    if( linkHref &&
                        linkHref.includes(SEARCHED_LINK) ) {
                        return true;
                    }

                    // if( linkHref?.includes(SEARCHED_LINK) ) {
                    //     return true;
                    // }
                }
                return false;
            }

            return searchRecursively([...document.querySelectorAll('a')]);
        }, SEARCHED_LINK);

        //await page.screenshot({ path: 'example.png' });

        console.log(`isContainsSearchLink `, isContainsSearchLink);
        console.log(`Total data used: ${totalBytes/1048576} MB`);

        await browser.close();
    } catch (err) {
        console.log('err ', err);
        await browser.close();
    }
})();

