let lives;
window.onload = getLives;

// Botões de organização
$('.liveclasses thead').contextmenu(() => false);
$('.watccol').click(() => sortBy('watc')).contextmenu(() => sortBy('watc', false));
$('.namecol').click(() => sortBy('name')).contextmenu(() => sortBy('name', false));
$('.disccol').click(() => sortBy('disc')).contextmenu(() => sortBy('disc', false));
$('.datecol').click(() => sortBy('date')).contextmenu(() => sortBy('date', false));

// Salva os IDs das lives assistidas
$('.liveclasses').on('change', '.watched', function () {
	let id = $(this).data('id');
	localStorage.setItem(`live-${id}`, $(this).prop('checked'));
});

// Abre o editor da lista de lives
$('#openeditor').contextmenu(() => {
	$('#openeditor').click(() => {
		window.open('/settings')
	});
	return false;
});

// Retorna a lista de lives pelo arquivo
function getLives() {
	$.getJSON('https://jsonstorage.net/api/items/38ceee94-8f71-4399-ab9a-4f51043baab8')
		.done(data => { lives = data; sortBy('reverse'); updateViewed(); mountFilters(); })
		.fail(err => $('.loadstatus').text(`Erro ${err.status}`).css('color', 'red'));
}

// Renderiza a lista de lives
function openlives(data = []) {
	let html = '';
	if (data.length) {
		data.forEach(l => {
			let attachments = '';
			l.attachments.forEach(a => {
				attachments += attachment(a.name, a.url);
			});
			html += list(l.disc, l.name, l.date, l.link, attachments, l.id);
		});
	} else {
		html = '<tr><td colspan="5">Nenhuma live registrada</td></tr>';
	}
	$('.liveclasses tbody').html(html);
}

function updateViewed() {
	let viewed = JSON.parse(localStorage.getItem('viewed') || '[]');
	lives.forEach(l => {
		if(!viewed.includes(l.id)) { viewed.push(l.id) };
	});
	localStorage.setItem('viewed', JSON.stringify(viewed));
}

// Organiza a lista de lives
// watc, name, disc, date, reverse
function sortBy(sort, asc = true) {
	switch (sort) {
		case 'name':
		case 'disc':
		case 'date':
			lives.sort((a, b) => {
				if (a[sort] < b[sort]) return asc ? -1 : 1;
				if (a[sort] > b[sort]) return asc ? 1 : -1;
				return 0;
			});
			break;
		case 'watc':
			lives.sort((a, b) => {
				if ($(`[data-id=${a.id}]`).prop('checked') && !$(`[data-id=${b.id}]`).prop('checked'))
					return asc ? 1 : -1;
				if (!$(`[data-id=${a.id}]`).prop('checked') && $(`[data-id=${b.id}]`).prop('checked'))
					return asc ? -1 : 1;
				return 0;
			});
			break;
		case 'reverse':
			lives.reverse();
			break;
	}
	openlives(lives);
}

function formatDate(date) {
	return date.split('-').reverse().join('/');
}

function mountFilters() {
	let disciplinas = [];
	lives.forEach(d => {
		disciplinas.push(d.disc);
	});
	disciplinas = Array.from(new Set(disciplinas));
	disciplinas.sort((a, b) => {
		if (a < b) return -1;
		if (a > b) return 1;
		return 0;
	});
	disciplinas.forEach(d => {
		$('#disc-filter').append(new Option(d, d));
	});
}

// Filtra as lives por disciplina
$('#disc-filter').change(function () {
	let disciplinas = $(this).val();
	let livesFiltered = lives.filter(l => {
		return disciplinas.includes(l.disc);
	});
	openlives(livesFiltered);
});

// Remove os filtros
$('#remove-filters').click(() => {
	$('#disc-filter option:selected').prop('selected', false);
	openlives(lives);
});

// Retorna o HTML de um elemento da lista de lives
function list (disc, name, date, link, attachments, id) {
	return `
		<tr>
			<td>
				<label class="custom-control custom-checkbox">
					<input type="checkbox" class="custom-control-input watched" data-id="${id}"
						${localStorage.getItem(`live-${id}`) == "true" ? " checked" : ""}
						${!id ? " disabled" : ""}>
					<span class="custom-control-label"></span>
				</label>
			</td>
			<td>
				<a href="${link || '#'}" target="_blank" class="text-dark">${disc || '-'}</a>
				${(localStorage.getItem('viewed') && !JSON.parse(localStorage.getItem('viewed') || '[]').includes(id)) ?
					'<sup class="mdi mdi-circle text-danger"></sup>' : ''}
			</td>
			<td>
				${name.replace(/\n/g, '<br>') || '-'}
			</td>
			<td>
				${formatDate(date) || '-'}
			</td>
			<td>
				<a href="${link || '#'}" class="btn btn-sm btn-secondary">ABRIR</button>
			</td>
			<td>
				${attachments || '-'}
			</td>
		</tr>
	`;
}

function attachment(name, url) {
	return `
		<a href="${url || '#'}" class="d-block">${name || '(Sem nome)'}</a>
	`;
}