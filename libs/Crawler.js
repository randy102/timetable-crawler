const puppeteer = require('puppeteer')
const subjectParser = require("../helper/subjectParser");
const mergeSet = require("../helper/mergeSet");
const teacherMapper = require("../helper/teacherMapper");
const { lengthPolicy, noSpecialCharacterPolicy } = require("../helper/termPolicies");
const { subjectCache } = require("../helper/cache");

const CRAWL_URL = 'http://thongtindaotao.sgu.edu.vn/'
const TKB_URL = 'http://thongtindaotao.sgu.edu.vn/Default.aspx?page=thoikhoabieu&sta=1'

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
            let { teacherCodes, parsedSubjects } = await this.getSubjectData(searchTerms, browser)
            console.log("Teacher codes: ", teacherCodes)

            const teacherName = await this.getTeacherNames(teacherCodes, browser)
            console.log("Teacher names: ", teacherName)

            teacherMapper(parsedSubjects, teacherName)

            this.cacheSubjects(parsedSubjects)

            return parsedSubjects
        } catch (e){
            throw e
        } finally {
            await browser.close()
        }
    }

    validateSearchTerm(terms) {
        for (let term of terms) {
            const isValid = lengthPolicy(term) && noSpecialCharacterPolicy(term)
            if(!isValid){
                throw new Error("Invalid subject: " + term)
            }
        }
    }

    async getSubjectData(searchTerms, browser) {
        let parsedSubjects = []
        let teacherCodes = {}

        const page = await browser.newPage();
        await page.goto(CRAWL_URL);
        await page.click('#ctl00_menu_lblThoiKhoaBieu')

        await page.waitForSelector('#ctl00_ContentPlaceHolder1_ctl00_btnOK')
        await page.click('#ctl00_ContentPlaceHolder1_ctl00_btnOK')

        for (const subjectId of searchTerms) {
            if(subjectCache.has(subjectId)){
                parsedSubjects.push(subjectCache.get(subjectId))
                console.log("Cache hit: " + subjectId)
                continue
            }

            console.log("Cache missed: " + subjectId)

            await page.waitForSelector('#ctl00_ContentPlaceHolder1_ctl00_txtloc')
            await page.evaluate(() => {
                const searchInput = document.getElementById('ctl00_ContentPlaceHolder1_ctl00_txtloc');
                searchInput.value = '';
            });
            await page.focus('#ctl00_ContentPlaceHolder1_ctl00_txtloc')
            await page.keyboard.type(subjectId)
            await page.click('#ctl00_ContentPlaceHolder1_ctl00_bntLocTKB')
            await page.waitForTimeout(2000)

            const [subjectData, subjectTeacherCodes] = await page.evaluate(subjectParser)
            console.log("Subject data: ", JSON.stringify(subjectData))

            if (!subjectData) {
                throw new Error("Invalid subject: " + subjectId)
            } else {
                parsedSubjects.push(subjectData)
                teacherCodes = mergeSet(teacherCodes, subjectTeacherCodes)
            }
        }

        return { parsedSubjects, teacherCodes }
    }

    cacheSubjects(subjects){
        for (let subject of subjects){
            if (!subjectCache.has(subject['subjectId'])){
                subjectCache.set(subject['subjectId'], subject)
                console.log("Cache stored: ", subject['subjectId'])
            }
        }
    }

    async getTeacherNames(codes = {}, browser) {
        const page = await browser.newPage();
        for (let code of Object.keys(codes)) {
            await page.goto(`${TKB_URL}&id=${code}`);
            codes[code] = await page.evaluate(() => {
                const teacherName = document.getElementById('ctl00_ContentPlaceHolder1_ctl00_lblContentTenSV')
                return teacherName ? teacherName.innerText : ''
            })
        }
        return codes
    }
}

module.exports = Crawler