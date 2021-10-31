function teacherMapper(subjects, teacherNames){
    for (let subject of subjects) {
        for (let cls of subject['classes']) {
            for (let session of cls['sessions']) {
                session['teacher'] = teacherNames[session['teacher']]
            }
        }
    }
}

module.exports = teacherMapper