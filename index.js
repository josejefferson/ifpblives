console.clear()
global.localhost = true

const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const path = require('path')
const routes = require('./modules/routes')
const { dateH } = require('./modules/functions')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))
app.use('/', routes)
app.use((req, res) => {
	res.status(404).sendFile(path.join(__dirname, 'pages/404.html'))
})

app.listen(3000, () => {
	console.log(`>> [${dateH()}] Aberto na porta 3000`)
})