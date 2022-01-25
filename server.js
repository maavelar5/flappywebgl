const fs = require('fs')

const express = require('express')

const hbl = require('express-handlebars')
const app = express()
const port = process.env.PORT || 3000

app.use(express.static(`${__dirname}`))

app.engine('handlebars', hbl.engine());

app.set('view engine', 'handlebars');
app.set('views', './views');

app.get('/', (req, res) => {
    const fsSource = fs.readFileSync(`${__dirname}/fragment.glsl`).toString()
    const vsSource = fs.readFileSync(`${__dirname}/vertex.glsl`).toString()
    const baseJs = fs.readFileSync(`${__dirname}/main.js`).toString()

    res.render('home', {vsSource, fsSource, baseJs})
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)})
