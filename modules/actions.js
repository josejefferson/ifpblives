const path = require('path')
const fs = require('fs')
const fetch = require('node-fetch')
const md5 = require('md5')
const OneSignal = require('onesignal-node')
const client = new OneSignal.Client('18b1561d-b987-451d-8838-ec933c470647',
	'YWQ3ZTM0YTYtYTI0Ni00NmMwLWE3OTUtMTA0ZjJmODU2NzYx')
const admins = require('./admins')
const functions = require('./functions')

function authenticate(req, res) {
	const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
	const auth = Buffer.from(b64auth, 'base64').toString().split(':')
	const [login, password] = auth;

	if (login && password && md5(password) == admins[login]) return true

	res.set('WWW-Authenticate', 'Basic realm="É necessária uma autenticação para acessar esta página"')
	res.status(401).sendFile(path.join(__dirname, '../pages/401.html'))
	return false
}

function save(data, schclass, res) {
	// Arquivo principal
	fs.writeFile(`public/data/lives${schclass}.json`, data, err => {
		if (err) { console.log(err); res.send(['Ocorreu um erro desconhecido ao salvar o arquivo']) }
		console.log(`Arquivo principal ${schclass} salvo!`)

		// Arquivo de backup
		fs.writeFile(`public/data/backups/bkp-${schclass}-${functions.fDate()}.json`, data, err => {
			if (err) { console.log(err); res.send(['Ocorreu um erro desconhecido ao salvar o arquivo de backup']) }
			console.log(`Arquivo de backup ${schclass} salvo!`)
			res.send([])
		})
	})
}

function saveOnline(data, dbURL, schclass, res) {
	fetch(dbURL, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: data
	}).then(resp => {
		if (!resp.ok) { console.log(resp); res.send(['Ocorreu um erro desconhecido ao salvar o arquivo']) }
		console.log(`Arquivo ${schclass} salvo online!`)
		res.send([])
	})
}

function generateNotificationText(data, schclass) {
	console.log(data.sendNotification)
	if (data.sendNotification == "true") {
		if (data.additions &&
			(data.additions.livesAdd && data.additions.livesAdd.length) ||
			(data.additions.attachAdd && data.additions.attachAdd.length)
		) {
			let notificationText = '🌟 Novos itens foram adicionados ao site:\n';
			notificationText += `🏫 Turma: ${schclass == '1e2' ? '1º e 2ºs anos' : '3º e 4ºs anos'}\n\n`

			// Lives adicionadas
			if (data.additions.livesAdd && data.additions.livesAdd.length) {
				data.additions.livesAdd.forEach(l => {
					notificationText += `🔴 ${l.disc} (${functions.fDateFromInput(l.date)})\n`
				})
				notificationText += '\n'
			}

			// Anexos adicionados
			if (data.additions.attachAdd && data.additions.attachAdd.length) {
				data.additions.attachAdd.forEach(a => {
					notificationText += `📎 ${a.name} (${a.disc} - ${functions.fDateFromInput(a.date)})\n`
				})
				notificationText += '\n'
			}

			return notificationText.trim()
		}
	}
	return false;
}

function notify(text, segment, link, separate = false) {
	const notification = {
		...(separate && { headings: { 'en': 'Lives do IFPB (✉️ Mensagem)' } }),
		contents: {
			'en': text || 'Teste'
		},
		...(link && { url: link }),
		included_segments: !localhost ? (segment ? [segment] : ['Subscribed Users']) : ['TestDevices'],
		web_push_topic: separate ? Math.floor(Math.random() * 9999999).toString() : segment,
		template_id: '379352f0-69ae-4b4d-b9c3-eaa90108ca76'
	}

	try {
		client.createNotification(notification)
		console.log(`Notificação enviada:\n\n${text}\n`)
	} catch {
		console.log('Notificação não enviada')
	}
}

module.exports = {
	authenticate,
	save,
	saveOnline,
	generateNotificationText,
	notify
}