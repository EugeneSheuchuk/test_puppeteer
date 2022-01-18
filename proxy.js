const puppeteer = require('puppeteer');

const SEARCHED_LINK = '--M1x9s9NYs';
const LINK_NAME = 'Вайтишный Новогодний стрим - призы, планы на 2022 год'.toLowerCase();
const VK_URL = 'https://vk.com/id4255985?w=wall4255985_144';
const VK_SELECTOR = '.wl_post_body_wrap';

(async () => {
    const browser = await puppeteer.launch({
        args: [ '--proxy-server=SOCKS4://166.62.118.86:48127', ],
    });
    try {
        let totalBytes = 0;

        const page = await browser.newPage();
        // Добавляем логику подсчета трафика
        page.setRequestInterception(true);
        // page.on('request', request => {
        //     request.continue();
        // });
        // Экономим трафик не загружая картинки и css
        page.on('request', request => {
            if (request.url().endsWith('.png') ||
                request.url().endsWith('.jpg') ||
                request.url().endsWith('.jpeg') ||
                request.url().endsWith('.gif') ||
                request.url().endsWith('.mp3') ||
                request.url().endsWith('.css')) {
                request.abort();
            } else {
                request.continue();
            }
        });
        page.on('response', response => {
            let headers = response.headers();
            if ( typeof headers['content-length'] !== 'undefined' ){
                let length = parseInt( headers['content-length'] );
                totalBytes+= length;
            }
        });

        const repeatFunc = async (page) => {
            try {
                await page.goto(VK_URL, {
                    //waitUntil: 'networkidle2',
                    waitUntil: 'load',
                    timeout: 0,
                });
                await page.screenshot({ path: 'first.png' });
                const videoLink = await page.evaluate((VK_SELECTOR, LINK_NAME) => {
                    function searchRecursively(elements) {
                        const hrefRegex = new RegExp(/\/video\d{1,}_\d{1,}/);
                        const links = [];
                        elements.forEach(el => {
                            links.push(...el.querySelectorAll('a'));
                        });
                        if (links.length === 0) {
                            return null;
                        }
                        for (let i = 0; i < links.length; i++) {
                            let el = links[i];
                            const ariaLabel = el.getAttribute('aria-label');
                            const linkHref = el.getAttribute('href');
                            // if( ariaLabel &&
                            //     ariaLabel.toLowerCase().includes(LINK_NAME) &&
                            //     linkHref &&
                            //     hrefRegex.test(linkHref) ) {
                            //     return linkHref;
                            // }
                            if( linkHref &&
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
                    //waitUntil: 'networkidle2',
                    waitUntil: 'load',
                    timeout: 0,
                });
                await page.screenshot({ path: 'second.png' });
                // const isContainsSearchLink = await page.evaluate((SEARCHED_LINK) => {
                //     function searchRecursively(elements) {
                //         if (elements.length === 0) {
                //             return false;
                //         }
                //         for (let i = 0; i < elements.length; i++) {
                //             let el = elements[i];
                //             const linkHref = el.getAttribute('href');
                //
                //             if( linkHref &&
                //                 linkHref.includes(SEARCHED_LINK) ) {
                //                 return true;
                //             }
                //
                //         }
                //         return false;
                //     }
                //
                //     return searchRecursively([...document.querySelectorAll('a')]);
                // }, SEARCHED_LINK);
                //
                // console.log(`isContainsSearchLink `, isContainsSearchLink);
                // console.log(`Total data used: ${totalBytes/1048576} MB`);

                await page.waitForSelector('iframe');
                await page.waitForTimeout(5000);

                const iFramesSRC = await page.evaluate(() => {
                    return [...document.querySelectorAll('iframe')].map(el => el.getAttribute('src'));
                });

                console.log('iFramesSRC ', iFramesSRC);
                console.log(iFramesSRC.some(e => {
                    if (e) {
                        return e.includes(SEARCHED_LINK);
                    }
                    return false;
                }));
                console.log(`Total data used: ${totalBytes/1048576} MB`);
                return true;
            } catch (err) {
                console.log(err.message);
                return false;
            }
        }


        let data = false;
        let attempts = 0;

        // Retry request until it gets data or tries 5 times
        while(data === false && attempts < 5)
        {
            data = await repeatFunc(page);
            attempts += 1;
            if (data === false) {
                // Wait a few seconds, also a good idea to swap proxy here*
                await new Promise((resolve) => setTimeout(resolve, 3000));
            }
        }

        await browser.close();
    } catch (err) {
        console.log('err ', err);
        await browser.close();
    }
})();
