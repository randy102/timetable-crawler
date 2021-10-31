function teacherMapper(subjects, teacherNames){
    for (let subject of subjects) {
        if (!subject['classes']) continue
        for (let cls of subject['classes']) {
            if (!cls['sessions']) continue
            for (let session of cls['sessions']) {
                session['teacher'] = teacherNames[session['teacher']] || session['teacher']
            }
        }
    }
}

module.exports = teacherMapper