let lives;
window.onload = getLives;
window.onbeforeunload = () => '';

// Verifica as opções
localStorage.getItem('opt-autoScrollEnd') == 'true' && $('#autoScrollEnd').prop('checked', true);
localStorage.getItem('opt-addAutoScroll') == 'false' && $('#addAutoScroll').prop('checked', false);
localStorage.getItem('opt-autoFocus') == 'false' && $('#autoFocus').prop('checked', false);
localStorage.getItem('opt-autoAdd') == 'true' && $('#autoAdd').prop('checked', true);

$('.option').change(function (e) {
	localStorage.setItem(`opt-${e.target.id}`, $(this).prop('checked'));
});

// Retorna a lista de lives pelo arquivo
function getLives() {
	$.getJSON('https://jsonstorage.net/api/items/38ceee94-8f71-4399-ab9a-4f51043baab8')
		.done(data => { lives = data; openlives(lives); $('#autoAdd').prop('checked') && addLive(); mountDiscList(); })
		.fail(err => $('.loadstatus').text(`Erro ${err.status}`).addClass('text-danger'));
}

// Renderiza a lista de lives
function openlives(data = []) {
	let html = '';
	data.forEach(l => {
		html += list(l.disc, l.name, l.date, l.link, l.id);
	});
	$('.liveclasses tbody').html(html);
	if ($('#autoScrollEnd').prop('checked')) $('html, body').animate({
		scrollTop: $('.liveclasses tbody tr:last-child').offset().top
	}, 500);
}

// Adiciona um novo item a lista
$('.add').click(addLive);

function addLive() {
	$('.liveclasses tbody').append(list(0, 0, 0, 0, 0, true));
	$('#addAutoScroll').prop('checked') && $('.liveclasses').parent().animate({ scrollLeft: 0 }, 200);
	$('#autoFocus').prop('checked') && $('.disc:last-child').focus();
}

// Remove um item da lista
$('.liveclasses').on('click', '.remove', function () {
	if (confirm("Tem certeza que deseja remover este item?")) {
		$(this).closest('.liveclass').replaceWith(`<tr class="table-danger" style="height: 2px;">
			<td colspan="6" class="p-0 border-0" style="height: 2px;"></td>
		</tr>`);
	}
});

// Move um item da lista para cima
$('.liveclasses').on('click', '.moveup', function () {
	$(this).closest('.liveclass').insertBefore($(this).closest('.liveclass').prev());
});

// Move um item da lista para baixo
$('.liveclasses').on('click', '.movedown', function () {
	$(this).closest('.liveclass').insertAfter($(this).closest('.liveclass').next());
});

// Salva a lista no arquivo
$('.save').click(save);

// Converte a lista de lives do DOM para um Array
function toArray() {
	let data = [];
	$('.liveclass').each(function () {
		let el = {};
		el.name = $(this).find('.name').val();
		el.date = $(this).find('.date').val();
		el.disc = $(this).find('.disc').val();
		el.link = $(this).find('.link').val();
		el.id = $(this).find('.id').val();
		data.push(el);
	});
	return data;
}

// Salva a lista de lives
function save() {
	if (confirm("Tem certeza que deseja salvar?")) {
		let data = toArray();
		$('.errors').html('');
		$('.savestatus').text('Salvando...').removeClass('text-success text-warning text-danger').addClass('text-warning');
		writeFile(JSON.stringify(data));
	}
}

// Salva a lista no arquivo
function writeFile(data) {
	$.post("write", { lives: data })
		.done(resp => {
			$('.errors').html('');
			resp.length && showErrors(resp);
			resp.length ?
				$('.savestatus').text('Falha').removeClass('text-success text-warning text-danger').addClass('text-danger') :
				$('.savestatus').text('Salvo').removeClass('text-success text-warning text-danger').addClass('text-success');
		}).fail(err => {
			console.log(err);
			$('.savestatus').text('Falha').removeClass('text-success text-warning text-danger').addClass('text-danger');
			if (err.status == 401) { showErrors(["Erro de autorização"]); return }
			showErrors(err.responseJSON);
		});
}

// Importa a lista de lives do arquivo
$('#importfile').change(async function () {
	try {
		let file = $(this)[0].files[0];
		let data = await readFile(file);
		lives = JSON.parse(data);
		if (confirm("Tem certeza que deseja importar do arquivo?")) openlives(lives);
		$(this).val('');
	} catch { }
});

// Exporta a lista de lives para o arquivo
$('#export').click(() => {
	$('#exportlink').attr({
		href: `data:text/plain,${encodeURIComponent(JSON.stringify(toArray()))}`,
		download: `ifpblives-${Date.now()}.json`
	}).removeClass('hidden');
});

// Formata a data
function formatDate(date) {
	let dt = new Date(date);
	let month = (dt.getMonth() + 1).toString();
	let day = dt.getDate().toString();
	let year = dt.getFullYear().toString();

	if (month.length < 2) month = '0' + month;
	if (day.length < 2) day = '0' + day;

	return [year, month, day].join('-');
}

// Gera um ID aleatório
function randomID() {
	let chars = '0123456789abcdefghijklmnopqrstuvwxyz';
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
function list (disc, name, date, link, id, newItem = false) {
	return `
		<tr class="liveclass${newItem ? ' table-success' : ''}">
			<td>
				<button class="btn btn-sm btn-info moveup"><i class="mdi mdi-arrow-up"></i></button>
				<button class="btn btn-sm btn-info movedown"><i class="mdi mdi-arrow-down"></i></button>
			</td>
			<td>
				<input type="text" class="form-control disc" placeholder="Disciplina..." value="${disc || ''}" list="disciplinas">
			</td>
			<td>
				<textarea class="form-control name" placeholder="Assunto...">${name || ''}</textarea>
			</td>
			<td>
				<input type="date" class="form-control date" value="${date || formatDate(Date.now())}">
			</td>
			<td>
				<input type="url" class="form-control link" placeholder="Link..." value="${link || ''}">
			</td>
			<td>
				<button class="btn btn-danger remove"><i class="mdi mdi-delete"></i></button>
			</td>
			<input type="hidden" class="id" value="${id || randomID()}">
		</tr>
	`;
}