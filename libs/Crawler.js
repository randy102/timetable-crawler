const puppeteer = require('puppeteer')
const util = require('util')
const subjectParser = require("../helper/subjectParser");

const CRAWL_URL = 'http://thongtindaotao.sgu.edu.vn/'

class Crawler {
    constructor() {
        console.log("Runs")
    }

    async pull(searchTerms = []) {
        const browser = await puppeteer.launch({
            'args': [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });
        const page = await browser.newPage();
        await page.goto(CRAWL_URL);
        await page.click('#ctl00_menu_lblThoiKhoaBieu')

        await page.waitForSelector('#ctl00_ContentPlaceHolder1_ctl00_btnOK')
        await page.click('#ctl00_ContentPlaceHolder1_ctl00_btnOK')

        let parsedSubjects = []
        let invalidSubjects = []

        for (const subject of searchTerms) {
            await page.waitForSelector('#ctl00_ContentPlaceHolder1_ctl00_txtloc')
            await page.evaluate(() => {
                const searchInput = document.getElementById('ctl00_ContentPlaceHolder1_ctl00_txtloc');
                searchInput.value = '';
            });
            await page.focus('#ctl00_ContentPlaceHolder1_ctl00_txtloc')
            await page.keyboard.type(subject)
            await page.click('#ctl00_ContentPlaceHolder1_ctl00_bntLocTKB')
            await page.waitForTimeout(1000)

            const subjectData = await page.evaluate(subjectParser)

            if (!subjectData) {
                invalidSubjects.push(subject)
            } else {
                parsedSubjects.push(subjectData)
            }
        }
        await browser.close()

        return [parsedSubjects, invalidSubjects]
    }


}

module.exports = Crawler