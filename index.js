const express = require('express')
const Crawler = require("./libs/Crawler");
const app = express()
const port = process.env.PORT || 3000

app.get('/', async (req, res) => {
    const crawler = new Crawler()
    const SUBJECTS = ['862408','810088']
    try {
        const [subjects, invalid] = await crawler.pull(SUBJECTS)
        res.json({  error: null, data: {subjects, invalid}})
    } catch (e){
        console.log("error: ", e.message)
        res.json({
            error: e.message,
            data: "Please try again later."
        })
    }
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})