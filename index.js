var localhost = false;

var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var md5 = require('md5')
var path = require('path')
var fs = require('fs')
var fetch = require('node-fetch')
var OneSignal = require('onesignal-node');
var client = new OneSignal.Client('18b1561d-b987-451d-8838-ec933c470647',
	'YWQ3ZTM0YTYtYTI0Ni00NmMwLWE3OTUtMTA0ZjJmODU2NzYx')

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
			if (req.body.sendNotification == "true") {
				if (req.body.additions &&
					(req.body.additions.livesAdd && req.body.additions.livesAdd.length) ||
					(req.body.additions.attachAdd && req.body.additions.attachAdd.length)
				) {
					let notificationText = '🌟 Novos itens foram adicionados ao site:\n';
					notificationText += `🏫 Turma: ${schclass == '1e2' ? '1º e 2ºs anos' : '3º e 4ºs anos'}\n\n`

					// Lives adicionadas
					if (req.body.additions.livesAdd && req.body.additions.livesAdd.length) {
						req.body.additions.livesAdd.forEach(l => {
							notificationText += `🔴 ${l.disc} (${formatDate(l.date)})\n`
						})
						notificationText += '\n'
					}

					// Anexos adicionados
					if (req.body.additions.attachAdd && req.body.additions.attachAdd.length) {
						req.body.additions.attachAdd.forEach(a => {
							notificationText += `📎 ${a.name} (${a.disc} - ${formatDate(a.date)})\n`
						})
						notificationText += '\n'
					}

					// Notificar
					notify(notificationText.trim(), `class${schclass}`)
				}
			}

			if (localhost) {
				fs.writeFile(`public/data/lives${schclass}.json`, data, err => {
					if (err) return res.send(["Ocorreu um erro desconhecido ao salvar o arquivo"])

					fs.writeFile(`public/data/backups/bkp-${schclass}-${date().cDate}.json`, data, err => {
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

app.post('/notify', (req, res) => {
	if (authenticate(req, res)) {
		let text = req.body.text
		let link = req.body.link || 0;
		let schclass = req.body.class == '3e4' ? '3e4' : '1e2'

		if (text) {
			notify(text, `class${schclass}`, link, true)
			res.send([])
		} else {
			res.send(['Texto vazio'])
		}
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

function formatDate(date) {
	return date.split('-').reverse().join('/');
}

function date() {
	let date = new Date();
	let parts = {
		y: date.getFullYear(),
		m: date.getMonth() + 1,
		d: date.getDate(),
		h: date.getHours(),
		mi: date.getMinutes(),
		s: date.getSeconds()
	}

	let y = parts.y.toString();
	let m = parts.m > 10 ? parts.m.toString() : '0' + parts.m;
	let d = parts.d > 10 ? parts.d.toString() : '0' + parts.d;
	let h = parts.h > 10 ? parts.h.toString() : '0' + parts.h;
	let mi = parts.mi > 10 ? parts.mi.toString() : '0' + parts.mi;
	let s = parts.s > 10 ? parts.s.toString() : '0' + parts.s;

	let cDate = [y, m, d, h, mi, s].join('-');

	return { y, m, d, h, mi, s, cDate };
}

function notify(text, segment, link, separate = false) {
	const notification = {
		...(separate && { headings: { 'en': 'Lives do IFPB (✉️ Mensagem)' } }),
		contents: {
			'en': text || 'Teste'
		},
		...(link && { url: link }),
		included_segments: segment ? [segment] : ['Subscribed Users'],
		web_push_topic: separate ? Math.floor(Math.random() * 9999999).toString() : segment,
		template_id: '379352f0-69ae-4b4d-b9c3-eaa90108ca76'
	}

	try {
		client.createNotification(notification)
	} catch {
		console.log('Notificação não enviada');
	}
}