const schClass = new URLSearchParams(window.location.search).get('class') == '3e4' ? '3e4' : '1e2'
const migrationData = btoa(JSON.stringify(localStorage))

window.location.href = `https://ifpblives.herokuapp.com/migrate.html?class=${schClass}&migrationData=${migrationData}`