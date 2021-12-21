const express = require('express')
const Crawler = require("./libs/Crawler");
const app = express()
const {subjectCache} = require('./helper/cache')

const port = process.env.PORT || 3000

app.get('/api/subjects', async (req, res) => {
    const crawler = new Crawler()
    const query = req.query['s']
    const terms = query ? req.query['s'].split(',') : []
    if (terms.length === 0) {
        return res.json({ error: 'Must give at least 1 term to process!', data: null })
    }
    try {
        console.time('pull')
        const subjects = await crawler.pull(terms)
        console.timeEnd('pull')
        return res.json({ error: null, data: { subjects } })
    } catch (e) {
        return res.json({ error: e.message, data: null })
    }
})

app.get('/api/cache/clear', (req, res) =>{
    subjectCache.flushAll()
    return res.end('OK')
})

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
})