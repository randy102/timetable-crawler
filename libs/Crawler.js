const puppeteer = require('puppeteer')
const util = require('util')
const subjectParser = require("../helper/subjectParser");
const mergeSet = require("../helper/mergeSet");
const teacherMapper = require("../helper/teacherMapper");

const CRAWL_URL = 'http://thongtindaotao.sgu.edu.vn/'

class Crawler {
    constructor() {
        console.log("Crawler initiated.")
    }

    async pull(searchTerms = []) {
        const browser = await puppeteer.launch({
            'args': [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });

        let {teacherCodes,invalidSubjects,parsedSubjects} = await this.getSubjectData(searchTerms, browser)

        const teacherName = await this.getTeacherNames(teacherCodes, browser)

        teacherMapper(parsedSubjects, teacherName)

        await browser.close()

        return [parsedSubjects, invalidSubjects]
    }

    async getSubjectData(searchTerms, browser){
        const page = await browser.newPage();
        await page.goto(CRAWL_URL);
        await page.click('#ctl00_menu_lblThoiKhoaBieu')

        await page.waitForSelector('#ctl00_ContentPlaceHolder1_ctl00_btnOK')
        await page.click('#ctl00_ContentPlaceHolder1_ctl00_btnOK')

        let parsedSubjects = []
        let invalidSubjects = []
        let teacherCodes = {}

        for (const subject of searchTerms) {
            await page.waitForSelector('#ctl00_ContentPlaceHolder1_ctl00_txtloc')
            await page.evaluate(() => {
                const searchInput = document.getElementById('ctl00_ContentPlaceHolder1_ctl00_txtloc');
                searchInput.value = '';
            });
            await page.focus('#ctl00_ContentPlaceHolder1_ctl00_txtloc')
            await page.keyboard.type(subject)
            await page.click('#ctl00_ContentPlaceHolder1_ctl00_bntLocTKB')
            await page.waitForTimeout(2000)

            const [subjectData, subjectTeacherCodes] = await page.evaluate(subjectParser)

            if (!subjectData) {
                invalidSubjects.push(subject)
            } else {
                parsedSubjects.push(subjectData)
                teacherCodes = mergeSet(teacherCodes, subjectTeacherCodes)
            }
        }

        return {parsedSubjects, invalidSubjects, teacherCodes}
    }

    async getTeacherNames(codes = {}, browser){
        const page = await browser.newPage();
        await page.goto(CRAWL_URL);

        for (let code of Object.keys(codes)){
            await page.waitForSelector('#ctl00_menu_lblThoiKhoaBieu')
            await page.click('#ctl00_menu_lblThoiKhoaBieu')

            await page.waitForSelector('#ctl00_ContentPlaceHolder1_ctl00_radioMaSV')
            await page.click('#ctl00_ContentPlaceHolder1_ctl00_radioMaSV')

            await page.waitForSelector('#ctl00_ContentPlaceHolder1_ctl00_txtMaSV')
            await page.focus('#ctl00_ContentPlaceHolder1_ctl00_txtMaSV')
            await page.keyboard.type(code)

            await page.waitForSelector('#ctl00_ContentPlaceHolder1_ctl00_btnOK')
            await page.click('#ctl00_ContentPlaceHolder1_ctl00_btnOK')

            await page.waitForTimeout(2000)

            const name = await page.evaluate(() => {
                return document.getElementById('ctl00_ContentPlaceHolder1_ctl00_lblContentTenSV').innerText
            })

            if (name){
                codes[code] = name
            }
        }
        return codes
    }


}

module.exports = Crawler