const express = require('express')
const Crawler = require("./libs/Crawler");
const { teacherCache, subjectCache } = require("./helper/cache");
const app = express()
const port = process.env.PORT || 3000

app.get('/api/subjects', async (req, res) => {
    const crawler = new Crawler()
    const query = req.query['s']
    const terms = query ? query.split(',') : []

    try {
        console.time('========= [Total]: ')
        const subjects = await crawler.pull(terms)
        return res.json({ error: null, data: { subjects } })
    } catch (e) {
        return res.json({ error: e.message, data: null })
    } finally {
        console.timeEnd('========= [Total]: ')
    }
})

app.get('/api/cache/teachers', (req, res) => {
    res.json(teacherCache.data)
})

app.get('/api/cache/subjects', (req, res) => {
    res.json(subjectCache.data)
})

app.get('/api/cache/flush/subject', (req, res) => {
    const password = req.query['password']
    if (password === process.env.CACHE_FLUSH_PASSWORD) {

        subjectCache.flushAll()
        res.send('OK')
    } else {
        res.send('Password is wrong!')
    }
})

const server = app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
})

server.timeout = 100000