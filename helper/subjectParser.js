function subjectParser() {
    const dayMap = {
        "Hai": 2,
        "Ba": 3,
        "Tư": 4,
        "Năm": 5,
        "Sáu": 6,
        "Bảy": 7,
    };

    const rows = Array.from(document.querySelectorAll("#ctl00_ContentPlaceHolder1_ctl00_pnlPage div.grid-roll2 > table > tbody > tr"));

    if (rows.length === 0) {
        return null
    }
    let subjectId = rows[0].querySelector("td:nth-child(1)").innerText;
    let subjectName = rows[0].querySelector("td:nth-child(2)").innerText;
    let credits = +rows[0].querySelector("td:nth-child(6)").innerText;

    let result = {
        subjectId,
        subjectName,
        credits,
        classes: [],
    };

    let teacherCodes = {}

    for (let row of rows) {
        let group = row.querySelector("td:nth-child(3)").innerText;
        let days = Array.from(row.querySelectorAll('td:nth-child(9) td, td:nth-child(9)>div')).map(x => dayMap[x.innerText]);
        let starts = Array.from(row.querySelectorAll('td:nth-child(10) td,td:nth-child(10)>div')).map(x => +x.innerText);
        let lengths = Array.from(row.querySelectorAll('td:nth-child(11) td, td:nth-child(11)>div')).map(x => +x.innerText);
        let rooms = Array.from(row.querySelectorAll('td:nth-child(12) td, td:nth-child(12)>div')).map(x => x.innerText);
        let teachers = Array.from(row.querySelectorAll('td:nth-child(13) td, td:nth-child(13)>div')).map(x => x.innerText);

        let sessions = [];

        days.forEach((day, index) => {
            sessions.push({
                day,
                start: starts[index],
                length: lengths[index],
                room: rooms[index],
                teacher: teachers[index]
            })

            teacherCodes[teachers[index]] = ''
        })

        result.classes.push({
            group,
            sessions
        });
    }

    return [result, teacherCodes];
}

module.exports = subjectParser