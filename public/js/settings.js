const localhost = false;

const schclass = new URLSearchParams(window.location.search).get('class') == '3e4' ? '3e4' : '1e2';
let dbURL;

if (schclass == '1e2') {
	// Turma dos 1ºs e 2ºs anos
	dbURL = 'https://jsonstorage.net/api/items/38ceee94-8f71-4399-ab9a-4f51043baab8';
	$('.home').attr('href', '/?class=1e2');
	$('.class').text('1º e 2ºs anos');

} else {
	// Turma dos 3ºs e 4ºs anos
	dbURL = 'https://jsonstorage.net/api/items/ce9f44a2-cddb-44a7-873a-f9ccca6d0ea7';
	$('.home').attr('href', '/?class=3e4');
	$('.class').text('3º e 4ºs anos');
}

let lives;
window.onload = getLives;
window.onbeforeunload = () => '';

// Verifica as opções
localStorage.getItem('opt-autoScrollEnd') == 'true' && $('#autoScrollEnd').prop('checked', true);
localStorage.getItem('opt-addAutoScroll') == 'false' && $('#addAutoScroll').prop('checked', false);
localStorage.getItem('opt-autoFocus') == 'false' && $('#autoFocus').prop('checked', false);
localStorage.getItem('opt-autoAdd') == 'true' && $('#autoAdd').prop('checked', true);
localStorage.getItem('opt-autoNotify') == 'false' && $('#autoNotify, #notify').prop('checked', false);

$('.option').change(function (e) {
	localStorage.setItem(`opt-${e.target.id}`, $(this).prop('checked'));
});

// Retorna a lista de lives pelo arquivo
function getLives() {
	$('.add, .save').prop('disabled', true);
	$.getJSON(localhost ? `data/lives${schclass}.json` : dbURL)
		.done(data => {
			lives = data;
			openlives(lives);
			$('#autoAdd').prop('checked') && addLive();
			mountDiscList();
			$('.add, .save').prop('disabled', false);
		})
		.fail(err => $('.loadstatus').text(`Erro ${err.status}`).addClass('text-danger'));
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
			html += list(l.disc, l.subject, l.date, l.link, attachments, l.id);
		});
	} else {
		html += '<tr><td colspan="7">Nenhuma live registrada</td></tr>'
	}

	$('.liveclasses tbody').html(html);
	
	if ($('#autoScrollEnd').prop('checked')) $('html, body').animate({
		scrollTop: $('.liveclasses tbody tr:last-child').offset().top
	}, 500);
}

// Adiciona um novo item a lista
$('.add').click(addLive);

function addLive() {
	$('.liveclasses tbody').append(list(0, 0, 0, 0, 0, 0, true));
	$('#addAutoScroll').prop('checked') && $('.liveclasses').parent().animate({ scrollLeft: 0 }, 200);
	$('#autoFocus').prop('checked') && $('.liveclasses tbody .liveclass:last-child .disc').focus();
}

// Remove um item da lista
$('.liveclasses').on('click', '.remove', function () {
	if (confirm("Tem certeza que deseja remover este item?")) {
		$(this).closest('.liveclass').replaceWith(`<tr class="table-danger removeditem" style="height: 2px;">
			<td colspan="7" class="p-0 border-0" style="height: 2px;"></td>
		</tr>`);
	}
});

// Adiciona anexos
$('.liveclasses').on('click', '.addattach', function () {
	$(this).before(attachment(0, 0, true));
});

// Remove anexos
$('.liveclasses').on('click', '.attachdelete', function () {
	$(this).closest('.attachment').remove();
});

// Move um item da lista para cima
$('.liveclasses').on('click', '.moveup', function () {
	$(this).closest('.liveclass').addClass('table-warning').insertBefore($(this).closest('.liveclass').prev());
});

// Move um item da lista para baixo
$('.liveclasses').on('click', '.movedown', function () {
	$(this).closest('.liveclass').addClass('table-warning').insertAfter($(this).closest('.liveclass').next());
});

// Salva a lista no arquivo
$('.save').click(save);

$('.sendnotify').click(sendNotification);

// Converte a lista de lives do DOM para um Array
function toArray() {
	let data = [];
	$('.liveclass').each(function () {
		data.push({
			disc: $(this).find('.disc').val(),
			subject: $(this).find('.subject').val(),
			date: $(this).find('.date').val(),
			link: $(this).find('.link').val(),
			attachments: readAttachs(this),
			id: $(this).find('.id').val()
		});
	});
	return data;
}

// Salva a lista de lives
function save() {
	if (confirm("Tem certeza que deseja salvar?")) {
		const data = toArray();
		$('.errors').html('');
		$('.savestatus').text('Salvando...').removeClass('text-success text-warning text-danger').addClass('text-warning');
		writeFile(JSON.stringify(data));
	}
}

// Salva a lista no arquivo
function writeFile(data) {
	const sendNotification = ($('#notify').prop('checked') &&
		($('.newitem').length || $('.newattach').length)) ? true : false;
	$.post('write', {
		class: schclass,
		lives: data,
		sendNotification: sendNotification,
		additions: sendNotification ? getAdditions() : {}
	})
		.done(resp => {
			$('.errors').html('');
			resp.length && showErrors(resp);
			resp.length ?
				$('.savestatus').text('Falha').removeClass('text-success text-warning text-danger').addClass('text-danger') :
				$('.savestatus').text('Salvo').removeClass('text-success text-warning text-danger').addClass('text-success');
			$('.newitem, .newattach, .table-warning').removeClass('table-success table-warning newitem newattach');
			$('.removeditem').remove();
		}).fail(err => {
			console.log(err);
			$('.savestatus').text('Falha').removeClass('text-success text-warning text-danger').addClass('text-danger');
			if (err.status == 401) { showErrors(["Erro de autorização"]); return }
			showErrors(err.responseJSON);
		});
}

// Envia uma notificação aos alunos
function sendNotification() {
	$('.notifyerrors').html('');
	$('.notifystatus').text('Enviando...').removeClass('text-success text-warning text-danger').addClass('text-warning');
	$.post('notify', {
		class: schclass,
		text: $('#notification-text').val(),
		link: $('#notification-link').val()
	})
		.done(resp => {
			$('.notifyerrors').html('');
			resp.length && showNotifyErrors(resp);
			resp.length ?
				$('.notifystatus').text('Falha').removeClass('text-success text-warning text-danger').addClass('text-danger') :
				$('.notifystatus').text('Enviada').removeClass('text-success text-warning text-danger').addClass('text-success');
			$('#notification-text, #notification-link').val('');
		}).fail(err => {
			console.log(err);
			$('.notifystatus').text('Falha').removeClass('text-success text-warning text-danger').addClass('text-danger');
			if (err.status == 401) { showNotifyErrors(["Erro de autorização"]); return }
			showNotifyErrors(err.responseJSON);
		});
}

// Importa a lista de lives do arquivo
$('#importfile').change(async function () {
	try {
		const file = $(this)[0].files[0];
		const data = await readFile(file);
		lives = JSON.parse(data);
		if (confirm("Tem certeza que deseja importar do arquivo?")) openlives(lives);
		$(this).val('');
	} catch { }
});

// Exporta a lista de lives para o arquivo
$('#export').click(() => {
	$('#exportlink').attr({
		href: `data:text/plain,${encodeURIComponent(JSON.stringify(toArray()))}`,
		download: `ifpblives ${schclass} ${moment().format('YYYY-MM-DD hh-mm-ssA')}.json`
	}).removeClass('hidden');
});

// Retorna os elementos adicionados
function getAdditions() {
	let livesAdd = [];
	let attachAdd = [];

	$('.newitem').each(function () {
		livesAdd.push({
			disc: $(this).find('.disc').val(),
			date: $(this).find('.date').val()
		});
	});

	$('.newattach').each(function () {
		attachAdd.push({
			name: $(this).find('.attachname').val(),
			disc: $(this).closest('.liveclass').find('.disc').val(),
			date: $(this).closest('.liveclass').find('.date').val(),
		});
	});

	return { livesAdd, attachAdd }
}

// Gera um ID aleatório
function randomID() {
	const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
	let string = '';

	for (let i = 0; i < 8; i++) {
		string += chars[Math.floor(Math.random() * chars.length)];
	}

	return string;
}

// Exibe erros de salvamento
function showErrors(errors = []) {
	$('.errors').html('');
	errors.forEach(err => {
		$('.errors').append(`<li><b>Erro:</b> ${err}</li>`);
	});
}

// Exibe erros de notificação
function showNotifyErrors(errors = []) {
	$('.notifyerrors').html('');
	errors.forEach(err => {
		$('.notifyerrors').append(`<li><b>Erro:</b> ${err}</li>`);
	});
}

function readFile(file) {
	return new Promise((resolve, reject) => {
		let reader = new FileReader();
		reader.onload = () => {
			resolve(reader.result);
		};
		reader.onerror = reject;
		reader.readAsText(file);
	});
}

function readAttachs(el) {
	let attachments = [];
	$(el).find('.attachment').each(function () {
		attach = {};
		attach.name = $(this).find('.attachname').val();
		attach.url = $(this).find('.attachurl').val();
		attachments.push(attach);
	});
	return attachments;
}

function mountDiscList() {
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
		$('#disciplinas').append(new Option(d, d));
	});
}

// Retorna um elemento da lista de lives
function list(disc, subject, date, link, attachments, id, newItem = false) {
	return `
		<tr class="liveclass${newItem ? ' table-success newitem' : ''}">
			<td>
				<button class="btn btn-sm btn-info moveup"><i class="mdi mdi-arrow-up"></i></button>
				<button class="btn btn-sm btn-info movedown"><i class="mdi mdi-arrow-down"></i></button>
			</td>
			<td>
				<input type="text" class="form-control disc" placeholder="Disciplina..." value="${disc || ''}" list="disciplinas">
			</td>
			<td>
				<textarea class="form-control subject" placeholder="Assunto...">${subject || ''}</textarea>
			</td>
			<td>
				<input type="date" class="form-control date" value="${date || moment().format('YYYY-MM-DD')}">
			</td>
			<td>
				<input type="url" class="form-control link" placeholder="Link..." value="${link || ''}">
			</td>
			<td>
				${attachments || ''}
				<button class="btn addattach"><i class="mdi mdi-plus"></i> Adicionar anexo</button>
			<td>
				<button class="btn btn-danger remove"><i class="mdi mdi-delete"></i></button>
			</td>
			<input type="hidden" class="id" value="${id || randomID()}">
		</tr>
	`;
}

function attachment(name, url, newItem = false) {
	return `
		<div class="attachment d-flex mb-1${newItem ? ' newattach' : ''}">
			<input type="text" class="form-control d-inline-flex mr-1 attachname" placeholder="Nome" value="${name || ''}">
			<input type="url" class="form-control d-inline-flex mr-1 attachurl" placeholder="Link" value="${url || ''}">
			<button class="btn btn-warning attachdelete"><i class="mdi mdi-delete"></i></button>
		</div>
	`;
}