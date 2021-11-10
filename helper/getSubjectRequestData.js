const FormData = require("form-data");

function getSubjectRequestData(viewGenerator, viewState, subjectId, cookies) {
    const form = new FormData()
    form.append("__VIEWSTATEGENERATOR", viewGenerator)
    form.append("__VIEWSTATE", viewState)
    form.append("ctl00$ContentPlaceHolder1$ctl00$ddlChonNHHK", "20211")
    form.append("__EVENTTARGET", "")
    form.append("__EVENTARGUMENT", "")
    form.append("__LASTFOCUS", "")
    form.append("ctl00$ContentPlaceHolder1$ctl00$ddlChon", "mh")
    form.append("ctl00$ContentPlaceHolder1$ctl00$txtloc", subjectId)
    form.append("ctl00$ContentPlaceHolder1$ctl00$ddlTuanorHk", "itemHK")
    form.append("ctl00$ContentPlaceHolder1$ctl00$bntLocTKB", "Lọc")
    form.append("ctl00$ContentPlaceHolder1$ctl00$rad_MonHoc", "rad_MonHoc")

    const headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36",
        "Cookie": cookies,
        ...form.getHeaders()
    }
    return { form, headers }
}


module.exports = getSubjectRequestData