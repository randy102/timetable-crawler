const subjectParser = require("../helper/subjectParser");
const mergeSet = require("../helper/mergeSet");
const teacherMapper = require("../helper/teacherMapper");
const { lengthPolicy, noSpecialCharacterPolicy } = require("../helper/termPolicies");
const { subjectCache, teacherCache } = require("../helper/cache");
const axios = require('axios').default;
const HTMLParser = require("node-html-parser");
const getSubjectRequestData = require("../helper/getSubjectRequestData");

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
        let viewStateGenerator
        let viewState
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
            console.time(`========= [Subject Request ${subjectId}]: `)
            if (!viewStateGenerator || !viewState) {
                const initResponse = await axios.get(TKB_URL)
                const document = HTMLParser.parse(initResponse.data)
                viewStateGenerator = document.querySelector('#__VIEWSTATEGENERATOR').getAttribute("value")
                viewState = document.querySelector('#__VIEWSTATE').getAttribute("value")
                cookies = initResponse.headers["set-cookie"][0].split(";")[0]
            }

            const { form, headers } = getSubjectRequestData(viewStateGenerator, viewState, subjectId, cookies)
            const response = await axios.post(TKB_URL, form, { headers })
            console.timeEnd(`========= [Subject Request ${subjectId}]: `)

            console.time(`========= [Subject Parse ${subjectId}]: `)
            const [subjectData, subjectTeacherCodes] = subjectParser(response.data)
            console.timeEnd(`========= [Subject Parse ${subjectId}]: `)

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
            if (teacherCache.has(code)) {
                codes[code] = teacherCache.get(code)
                continue
            }
            console.time(`========= [Teacher Request ${code}]: `)
            const response = await axios.get(`${TKB_URL}&id=${code}`)
            console.timeEnd(`========= [Teacher Request ${code}]: `)

            const document = HTMLParser.parse(response.data)
            const teacherName = document.querySelector('#ctl00_ContentPlaceHolder1_ctl00_lblContentTenSV')
            codes[code] = teacherName ? teacherName.innerText : ''
            teacherCache.set(code, codes[code])
        }
        return codes
    }
}

module.exports = Crawler