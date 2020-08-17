const express = require('express')
const routes = express.Router()
const actions = require('./actions')
const path = require('path')

routes.post('/migrate', (req, res) => {
	res.send(`
<!DOCTYPE html>
<html lang="pt-br">

<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Aguarde um momento - Lives do IFPB</title>
	<link rel="shortcut icon" href="/favicon.png" type="image/png">
	<link rel="stylesheet" href="/css/bootstrap.css">
	<link rel="stylesheet" href="/css/materialdesignicons.css">
	<link rel="stylesheet" href="/css/index.css">
</head>

<body>
	<a href="/" class="text-decoration-none">
		<header class="bg-success text-white py-4">
			<div class="container">
				<h1 class="d-flex align-items-baseline"><img src="/icons/svg.svg" class="mr-3 iflogo"> Lives do IFPB</h1>
			</div>
		</header>
	</a>

	<div class="container my-4">
		<main>
			<h2>Aguarde um momento...</h2>
			<i>Estamos redirecionado você para o novo site. Caso não seja redirecionado <a href="/">clique aqui</a></i>
		</main>
	</div>

	<script>
		const schclass = ${req.body.schclass || '1e2'}
		const b64MigData = ${req.body.migdata || ''}
	</script>
	<script src="/js/migrate.js"></script>
</body>

</html>
	`)
})

routes.get('/settings', (req, res) => {
	actions.authenticate(req, res) && res.sendFile(path.join(__dirname, '../pages/settings.html'))
})

routes.post('/write', (req, res) => {
	if (actions.authenticate(req, res)) {
		const data = req.body.lives
		const schclass = req.body.class == '3e4' ? '3e4' : '1e2'
		let dbURL;
		if (schclass == '1e2') dbURL = 'https://jsonstorage.net/api/items/38ceee94-8f71-4399-ab9a-4f51043baab8';
		if (schclass == '3e4') dbURL = 'https://jsonstorage.net/api/items/ce9f44a2-cddb-44a7-873a-f9ccca6d0ea7';

		if (data) {
			// Notificar
			const notificationText = actions.generateNotificationText(req.body, schclass);
			notificationText && actions.notify(notificationText, `class${schclass}`)
			
			if (localhost) {
				// Salva localmente
				actions.save(data, schclass, res);
			} else {
				// Salva online
				actions.saveOnline(data, dbURL, schclass, res)
			}
		} else {
			res.send(["Dados não especificados"])
		}
	} else {
		res.send(["Erro de autorização"])
	}
})

routes.post('/notify', (req, res) => {
	if (actions.authenticate(req, res)) {
		const text = req.body.text
		const link = req.body.link || 0;
		const schclass = req.body.class == '3e4' ? '3e4' : '1e2'

		if (text) {
			actions.notify(text, `class${schclass}`, link, true)
			res.send([])
		} else {
			res.send(['Texto vazio'])
		}
	}
})

module.exports = routes