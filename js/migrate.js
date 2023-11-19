try {

	if (localStorage.getItem('migrate') != 'true' && b64MigData) {
		const jsonMigData = atob(b64MigData)
		const migData = JSON.parse(jsonMigData)

		for (const key in migData) {
			const value = migData[key]
			localStorage.setItem(key, value)
		}

		localStorage.setItem('migrate', 'true')
	}

} catch { }

const schClass = new URLSearchParams(window.location.search).get('class') == '3e4' ? '3e4' : '1e2'
window.location.href = `/?class=${schClass}`