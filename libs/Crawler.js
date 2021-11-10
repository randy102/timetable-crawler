const subjectParser = require("../helper/subjectParser");
const mergeSet = require("../helper/mergeSet");
const teacherMapper = require("../helper/teacherMapper");
const { lengthPolicy, noSpecialCharacterPolicy } = require("../helper/termPolicies");
const { subjectCache } = require("../helper/cache");
const axios = require('axios').default;
const FormData = require('form-data');
const HTMLParser = require("node-html-parser");

const TKB_URL = 'http://thongtindaotao.sgu.edu.vn/Default.aspx?page=thoikhoabieu&load=all&sta=1'

class Crawler {
    constructor() {
        console.log("Crawler initiated.")
    }

    async pull(searchTerms = []) {
        if (searchTerms.length === 0) {
            throw new Error('Must give at least 1 term to process!')
        }

        console.log("Seach terms: ", searchTerms)

        this.validateSearchTerm(searchTerms)

        let { teacherCodes, parsedSubjects } = await this.getSubjectData(searchTerms)
        console.log("Teacher codes: ", teacherCodes)

        const teacherName = await this.getTeacherNames(teacherCodes)
        console.log("Teacher names: ", teacherName)

        teacherMapper(parsedSubjects, teacherName)

        this.cacheSubjects(parsedSubjects)

        return parsedSubjects

    }

    validateSearchTerm(terms) {
        for (let term of terms) {
            const isValid = lengthPolicy(term) && noSpecialCharacterPolicy(term)
            if (!isValid) {
                throw new Error("Invalid subject: " + term)
            }
        }
    }

    async getSubjectData(searchTerms) {
        let __VIEWSTATEGENERATOR
        let __VIEWSTATE
        let cookies
        let parsedSubjects = []
        let teacherCodes = {}

        for (const subjectId of searchTerms) {
            if (subjectCache.has(subjectId)) {
                parsedSubjects.push(subjectCache.get(subjectId))
                console.log("Cache hit: " + subjectId)
                continue
            }
            console.log("Cache missed: " + subjectId)

            if (!__VIEWSTATEGENERATOR || !__VIEWSTATE) {
                const initResponse = await axios.get(TKB_URL)
                const document = HTMLParser.parse(initResponse.data)
                __VIEWSTATEGENERATOR = document.querySelector('#__VIEWSTATEGENERATOR').getAttribute("value")
                __VIEWSTATE = document.querySelector('#__VIEWSTATE').getAttribute("value")
                cookies = initResponse.headers["set-cookie"][0].split(";")[0]
            }

            const form = new FormData()
            form.append("__VIEWSTATEGENERATOR", __VIEWSTATEGENERATOR)
            form.append("__VIEWSTATE", __VIEWSTATE)
            form.append("ctl00$ContentPlaceHolder1$ctl00$ddlChonNHHK", "20211")
            form.append("__EVENTTARGET", "")
            form.append("__EVENTARGUMENT", "")
            form.append("__LASTFOCUS", "")
            form.append("ctl00$ContentPlaceHolder1$ctl00$ddlChon", "mh")
            form.append("ctl00$ContentPlaceHolder1$ctl00$txtloc", subjectId)
            form.append("ctl00$ContentPlaceHolder1$ctl00$ddlTuanorHk", "itemHK")
            form.append("ctl00$ContentPlaceHolder1$ctl00$bntLocTKB", "Lọc")
            form.append("ctl00$ContentPlaceHolder1$ctl00$rad_MonHoc", "rad_MonHoc")

            const postHeaders = {
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36",
                "Cookie": cookies,
                ...form.getHeaders()
            }

            const response = await axios.post(TKB_URL, form, { headers: postHeaders })
            const [subjectData, subjectTeacherCodes] = subjectParser(response.data)

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

    cacheSubjects(subjects) {
        for (let subject of subjects) {
            if (!subjectCache.has(subject['subjectId'])) {
                subjectCache.set(subject['subjectId'], subject)
                console.log("Cache stored: ", subject['subjectId'])
            }
        }
    }

    async getTeacherNames(codes = {}) {
        for (let code of Object.keys(codes)) {
            const response = await axios.get(`${TKB_URL}&id=${code}`)
            const document = HTMLParser.parse(response.data)
            const teacherName = document.querySelector('#ctl00_ContentPlaceHolder1_ctl00_lblContentTenSV')
            codes[code] = teacherName ? teacherName.innerText : ''
        }
        return codes
    }
}

module.exports = Crawler