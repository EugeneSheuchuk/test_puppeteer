const puppeteer = require('puppeteer');

const FB_URL = 'https://www.facebook.com/YauheniSheuchuk/posts/113305771234453';
const VK_URL = 'https://vk.com/id4255985?w=wall4255985_142';

const VK_SELECTOR = '.wl_post_body_wrap';
const FB_Selector = 'a';

const SEARCH_LINK = 'wwваьдопрвбаопрлваопcom';

const loadedUrl = FB_URL;

(async () => {
    const browser = await puppeteer.launch();
    try {
        const page = await browser.newPage();
        const selector = loadedUrl.includes('vk.com') ? VK_SELECTOR : FB_Selector ;
        await page.goto(loadedUrl, {
            waitUntil: 'networkidle2',
        });
        await page.waitForSelector(selector);

        const isOurLink = await page.evaluate((selector, SEARCH_LINK) => {
            function searchRecursively(el) {
                if (el.innerText && el.innerText.toLowerCase() === SEARCH_LINK) {
                    return true;
                } else if (el.childNodes.length > 0) {
                    return [...el.childNodes].some(searchRecursively);
                }
                return false;
            }

            return [...document.querySelectorAll(selector)].some(searchRecursively);
        }, selector, SEARCH_LINK);

        //await page.screenshot({ path: 'example.png' });

        console.log('isOurLink ', isOurLink);

        await browser.close();
    } catch (err) {
        console.log('err ', err);
        await browser.close();
    }
})();