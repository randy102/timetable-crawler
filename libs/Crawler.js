const puppeteer = require('puppeteer')
const subjectParser = require("../helper/subjectParser");
const { lengthPolicy, noSpecialCharacterPolicy } = require("../helper/termPolicies");
const { subjectCache } = require("../helper/cache");

const CRAWL_URL = 'http://thongtindaotao.sgu.edu.vn/Default.aspx?page=thoikhoabieu&load=all&sta=1'

class Crawler {
    constructor() {
        console.log("Crawler initiated.")
    }

    async pull(searchTerms = []) {
        console.log("Seach terms: ", searchTerms)

        this.validateSearchTerm(searchTerms)

        const browser = await puppeteer.launch({
            'args': [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ],
            // headless: false
        });
        try {
            let parsedSubjects = await this.getSubjectData(searchTerms, browser)
            this.cacheSubjects(parsedSubjects)
            return parsedSubjects
        } catch (e) {
            throw e
        } finally {
            await browser.close()
        }
    }

    validateSearchTerm(terms) {
        for (let term of terms) {
            const isValid = lengthPolicy(term) && noSpecialCharacterPolicy(term)
            if (!isValid) {
                throw new Error("Invalid subject: " + term)
            }
        }
    }

    async getSubjectData(searchTerms, browser) {
        let parsedSubjects = [], page

        for (const subjectId of searchTerms) {
            if (subjectCache.has(subjectId)) {
                parsedSubjects.push(subjectCache.get(subjectId))
                console.log("Cache hit: " + subjectId)
                continue
            }
            console.log("Cache missed: " + subjectId)

            if(!page){
                page = await browser.newPage();
                page.goto(CRAWL_URL);
            }

            await page.waitForSelector('#ctl00_ContentPlaceHolder1_ctl00_txtloc')
            await page.evaluate(() => {
                const searchInput = document.getElementById('ctl00_ContentPlaceHolder1_ctl00_txtloc');
                searchInput.value = '';
            });
            await page.focus('#ctl00_ContentPlaceHolder1_ctl00_txtloc')
            await page.keyboard.type(subjectId)
            await page.click('#ctl00_ContentPlaceHolder1_ctl00_bntLocTKB')

            try {
                await page.waitForSelector("#ctl00_ContentPlaceHolder1_ctl00_bntLocTKB", { timeout: 10000 })
            } catch (e){
                throw new Error("Server is busy now, please try again later.")
            }

            const subjectData = await page.evaluate(subjectParser)
            console.log("Subject data: ", JSON.stringify(subjectData))

            if (!subjectData) {
                throw new Error("Invalid subject: " + subjectId)
            }

            parsedSubjects.push(subjectData)
        }
        return parsedSubjects
    }

    cacheSubjects(subjects) {
        for (let subject of subjects) {
            if (!subjectCache.has(subject['subjectId'])) {
                subjectCache.set(subject['subjectId'], subject)
                console.log("Cache stored: ", subject['subjectId'])
            }
        }
    }
}

module.exports = Crawler