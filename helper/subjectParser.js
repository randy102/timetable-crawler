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

    for (let row of rows) {
        let excluded = row.querySelector("td:nth-child(7)").innerText;
        if (excluded) continue

        let group = row.querySelector("td:nth-child(3)").innerText;
        let days = Array.from(row.querySelectorAll('td:nth-child(9) td, td:nth-child(9)>div')).map(x => dayMap[x.innerText]);
        let starts = Array.from(row.querySelectorAll('td:nth-child(10) td,td:nth-child(10)>div')).map(x => +x.innerText);
        let lengths = Array.from(row.querySelectorAll('td:nth-child(11) td, td:nth-child(11)>div')).map(x => +x.innerText);
        let rooms = Array.from(row.querySelectorAll('td:nth-child(12) td, td:nth-child(12)>div')).map(x => x.innerText);
        let weeks = Array.from(row.querySelectorAll('td:nth-child(14) td, td:nth-child(14)>div')).map(x => x.innerText);

        let sessions = days.map((day, index) => ({
            day,
            start: starts[index],
            length: lengths[index],
            room: rooms[index],
            week: weeks[index] && weeks[index].split("").map(c => c === '-' ? 0 : 1).concat(Array(15 - weeks[index].length).fill(0))
        }));

        if (sessions.some(s => s.start === 0)) {
            continue
        }

        result.classes.push({
            group,
            sessions
        });
    }

    return result;
}

module.exports = subjectParser