const fs = require('fs')

function get_shaders () {
    const fsSource = fs.readFileSync('./fragment.glsl').toString();
    const vsSource = fs.readFileSync('./vertex.glsl').toString();
    const baseJs = fs.readFileSync('./main.js').toString();

    let string = `
const fs = require('fs')

const express = require('express')

const hbl = require('express-handlebars')
const app = express()
const port = process.env.PORT || 3000

app.use(express.static('.'))

app.engine('handlebars', hbl.engine());

app.set('view engine', 'handlebars');
app.set('views', './views');

app.get('/', (req, res) => {
    const fsSource = \`${fsSource}\`
    const vsSource = \`${vsSource}\`
    const baseJs = \`${baseJs}\`

    res.render('home', {vsSource, fsSource, baseJs})
})

app.listen(port, () => {
    console.log('Example app listening at http://localhost:' + port)})
    `

    fs.writeFileSync('prod_server.js', string)
}

get_shaders();
