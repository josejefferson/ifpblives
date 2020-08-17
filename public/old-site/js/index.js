const schClass = new URLSearchParams(window.location.search).get('class') == '3e4' ? '3e4' : '1e2'
const migrationData = btoa(JSON.stringify(localStorage))

document.getElementById('migschclass').value = schClass
document.getElementById('migdata').value = migrationData
document.forms['migration'].submit()