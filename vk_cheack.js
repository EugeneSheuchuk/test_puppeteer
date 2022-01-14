const puppeteer = require('puppeteer');

const SEARCHED_LINK = 'https://www.youtube.com/watch?v=vHDrPL_6OAs';
const LINK_NAME = 'КАК ОНИ НА ЭТОМ ЕЗДЯТ ??? ГДЕ РУЧКИ ??? Тюнинг 2000х.'.toLowerCase();

const VK_URL = 'https://vk.com/id4255985?w=wall4255985_143';

const VK_SELECTOR = '.wl_post_body_wrap';

(async () => {
    // const browser = await puppeteer.launch({devtools: true});
    const browser = await puppeteer.launch();
    try {
        const page = await browser.newPage();
        await page.goto(VK_URL, {
            waitUntil: 'networkidle2',
        });
        await page.waitForSelector(VK_SELECTOR);

        const searchResult = await page.evaluate((selector, SEARCH_LINK, LINK_NAME) => {
            function searchRecursively(elements) {
                console.log('elements.length ', elements.length);
                for (let i = 0; i < elements.length; i++) {
                    const el = elements[i];
                    if (el.tagName === 'A') {
                        if (el.innerText && el.innerText.toLowerCase().includes(SEARCH_LINK)) {
                            return {
                                isInnerTextMatchSearchLink: true,
                                isInnerTextMatchLinkName: false,
                                isAttributeMatchLinkName: false,
                                elId: el.getAttribute('id'),
                            };
                        } else if (el.innerText && el.innerText.toLowerCase().includes(LINK_NAME)) {
                            return {
                                isInnerTextMatchSearchLink: false,
                                isInnerTextMatchLinkName: true,
                                isAttributeMatchLinkName: false,
                                elId: el.getAttribute('id'),
                            };
                        } else if (el.getAttribute('aria-label') &&
                                    el.getAttribute('aria-label').toLowerCase().includes(LINK_NAME)) {
                            let identifier = el.getAttribute('id') === null
                                ? null
                                : '#' + el.getAttribute('id');
                            if (!identifier) {
                                identifier = '.' + el.getAttribute('class')
                                    .split(' ')
                                    .map(e => e.trim())
                                    .filter(e => e !== '')
                                    .join('.');
                                if (!identifier || identifier.length < 10) {
                                    if (el.childNodes.length > 0) {
                                        return searchRecursively([...el.childNodes]);
                                    }
                                }
                            }

                            return {
                                isInnerTextMatchSearchLink: false,
                                isInnerTextMatchLinkName: false,
                                isAttributeMatchLinkName: true,
                                elId: identifier,
                            };
                        }
                    } else if (el.childNodes.length > 0) {
                        return searchRecursively([...el.childNodes]);
                    }
                    return {
                        isInnerTextMatchSearchLink: false,
                        isInnerTextMatchLinkName: false,
                        isAttributeMatchLinkName: false,
                        elId: '',
                    };
                }
            }

            return searchRecursively([...document.querySelectorAll(selector)]);
        }, VK_SELECTOR, SEARCHED_LINK, LINK_NAME);

        //await page.screenshot({ path: 'example.png' });

        console.log('searchResult ', searchResult);

        if (searchResult.elId != '') {
            await page.click(searchResult.elId);
            let pages = await browser.pages();
            await page.waitForNavigation();

            await page.screenshot({ path: 'newPage.png' });
        }

        await browser.close();
    } catch (err) {
        console.log('err ', err);
        await browser.close();
    }
})();