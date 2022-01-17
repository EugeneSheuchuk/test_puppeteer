const puppeteer = require('puppeteer');

const SEARCHED_LINK = '--M1x9s9NYs';
const LINK_NAME = 'Вайтишный Новогодний стрим - призы, планы на 2022 год'.toLowerCase();
const VK_URL = 'https://vk.com/id4255985?w=wall4255985_144';
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
                while (elements.length > 0) {
                    const el = elements.shift();
                    debugger
                    if (el.tagName === 'A') {
                        if (el.innerText && el.innerText.toLowerCase().includes(SEARCH_LINK)) {
                            return {
                                isInnerTextMatchSearchLink: true,
                                isInnerTextMatchLinkName: false,
                                isAttributeMatchLinkName: false,
                                elId: `#${el.getAttribute('id')}`,
                            };
                        } else if (el.innerText && el.innerText.toLowerCase().includes(LINK_NAME)) {
                            return {
                                isInnerTextMatchSearchLink: false,
                                isInnerTextMatchLinkName: true,
                                isAttributeMatchLinkName: false,
                                elId: `#${el.getAttribute('id')}`,
                            };
                        } else if (el.getAttribute('aria-label') &&
                                    el.getAttribute('aria-label').toLowerCase().includes(LINK_NAME)) {
                            let identifier = el.getAttribute('id') === null
                                ? null
                                : `#${el.getAttribute('id')}`;
                            if (identifier === null) {
                                identifier = '.' + el.getAttribute('class')
                                    .split(' ')
                                    .map(e => e.trim())
                                    .filter(e => e !== '')
                                    .join('.');
                                if (!identifier || identifier.length < 10) {
                                    if (el.childNodes.length > 0) {
                                        elements.push(...el.childNodes);
                                    }
                                } else {
                                    return {
                                        isInnerTextMatchSearchLink: false,
                                        isInnerTextMatchLinkName: false,
                                        isAttributeMatchLinkName: true,
                                        elId: identifier,
                                    };
                                }
                                // if (el.childNodes.length > 0) {
                                //     elements.push(...el.childNodes);
                                // }
                            } else {
                                return {
                                    isInnerTextMatchSearchLink: false,
                                    isInnerTextMatchLinkName: false,
                                    isAttributeMatchLinkName: true,
                                    elId: identifier,
                                };
                            }

                        }
                    } else if (el.childNodes.length > 0) {
                        elements.push(...el.childNodes);
                    }
                }

                return {
                    isInnerTextMatchSearchLink: false,
                    isInnerTextMatchLinkName: false,
                    isAttributeMatchLinkName: false,
                    elId: '',
                };
            }

            return searchRecursively([...document.querySelectorAll(selector)]);
        }, VK_SELECTOR, SEARCHED_LINK, LINK_NAME);

        console.log('searchResult ', searchResult);

        if (searchResult.elId != '') {
            if (searchResult.elId[0] !== '#') {
                await page.click(searchResult.elId);
                await page.waitForTimeout(100);
                const iFramesSRC = await getIframes(page);
                console.log('iFramesSRC ', iFramesSRC);
                console.log(iFramesSRC.some(e => {
                    if (e) {
                        return e.includes(SEARCHED_LINK);
                    }
                    return false;
                }));
                await browser.close();
            } else {
                await page.click(searchResult.elId);
                await page.waitForNavigation();
                await page.waitForTimeout(300);
                const iFramesSRC = await getIframes(page);
                console.log('iFramesSRC ', iFramesSRC);
                console.log(iFramesSRC.some(e => {
                    if (e) {
                        return e.includes(SEARCHED_LINK);
                    }
                    return false;
                }));
                await browser.close();
            }
        }

        await browser.close();
    } catch (err) {
        console.log('err ', err);
        await browser.close();
    }
})();

async function getIframes(page) {
    const iFramesSRC = await page.evaluate(() => {
        return [...document.querySelectorAll('iframe')].map(el => el.getAttribute('src'));
    });
    return iFramesSRC;
}