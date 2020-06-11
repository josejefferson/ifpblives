var localhost = false;

var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var md5 = require('md5')
var path = require('path')
var fs = require('fs')
var fetch = require('node-fetch')

const users = {
	"jefferson": "689eb857b6c9b6b7798af468a7d501cb",
	"thiago": "26d86f3166a13de93565b592316e642c",
	"fernando": "da6fa909f1c0188c539feb08d4496eb7"
}

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))

app.get('/settings', (req, res) => {
	authenticate(req, res) && res.sendFile(path.join(__dirname, 'settings.html'))
})

app.post('/write', (req, res) => {
	if (authenticate(req, res)) {
		let data = req.body.lives
		let schclass = req.body.class == '3e4' ? '3e4' : '1e2'
		let dbURL;
		if (schclass == '1e2') dbURL = 'https://jsonstorage.net/api/items/38ceee94-8f71-4399-ab9a-4f51043baab8';
		if (schclass == '3e4') dbURL = 'https://jsonstorage.net/api/items/ce9f44a2-cddb-44a7-873a-f9ccca6d0ea7';

		if (data) {
			if (localhost) {
				fs.writeFile(`public/data/lives${schclass}.json`, data, err => {
					if (err) return res.send(["Ocorreu um erro desconhecido ao salvar o arquivo"])

					fs.writeFile(`public/data/backups/bkp-${schclass}-${Date.now()}.json`, data, err => {
						if (err) return res.send(["Ocorreu um erro desconhecido ao salvar o arquivo"])
						res.send([])
					})
				})
			} else {
				fetch(dbURL, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: data
				}).then(resp => {
					if (resp.ok) res.send([])
					if (!resp.ok) {
						console.log(resp)
						res.send(["Ocorreu um erro desconhecido ao salvar o arquivo"])
					}
				})
			}
		} else {
			res.send(["Dados não especificados"])
		}
	} else {
		res.send(["Erro de autorização"])
	}
})

app.listen(3000, () => {
	console.log('>> Aberto na porta 3000')
})

function authenticate(req, res) {
	let b64auth = (req.headers.authorization || '').split(' ')[1] || ''
	let auth = Buffer.from(b64auth, 'base64').toString().split(':')
	let login = auth[0]
	let password = auth[1]

	if (login && password && md5(password) == users[login]) return true

	res.set('WWW-Authenticate', 'Basic realm="É necessária uma autenticação para acessar esta página"')
	res.status(401).send(`
		<meta name="viewport" content="width=device-width">
		<h1>Atualize a página e digite seu Login e Senha</h1>
		<i>Para ter acesso permanente a esta página, peça autorização ao administrador</i>`)
	return false
}