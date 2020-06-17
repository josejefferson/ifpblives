window.OneSignal = window.OneSignal || [];
OneSignal.push(function () {
	OneSignal.init({
		appId: "18b1561d-b987-451d-8838-ec933c470647",
		notifyButton: {
			enable: false
		},
		welcomeNotification: {
			disable: true
		}
	});

	// Navegador não suportado
	if (!OneSignal.isPushNotificationsSupported()) {
		return;
	}

	updateButton();
});

function turnOnOffNotifications() {
	OneSignal.getTags().then(tags => {
		if (tags && tags[`class${schclass}`] == "true") {
			// Desativa
			OneSignal.deleteTag(`class${schclass}`).then(updateButton);
		} else {
			// Ativa
			OneSignal.setSubscription(true);
			OneSignal.sendTag(`class${schclass}`, true).then(updateButton);
		}
	});
}

function buttonClick(e) {
	$('#notifications').text('Aguarde...').prop('disabled', true);

	getSubscriptionState().then(state => {
		if (state.isPushEnabled || state.isOptedOut) {
			// Desativar notificações
			turnOnOffNotifications();
		} else {
			// Pedir permissão para exibir notificações
			OneSignal.registerForPushNotifications().then(() => {
				turnOnOffNotifications();
			});
		}
	});
	e.preventDefault();
}

function updateButton() {
	OneSignal.getNotificationPermission().then(permission => {
		if (permission == "denied") {
			// Caso bloqueie as notificações
			$('#notifications-container').collapse('hide');
		} else {
			getSubscriptionState().then(state => {
				OneSignal.getTags().then(tags => {
					let notificationsEnabled = (state.isPushEnabled || !state.isOptedOut) &&
						(tags && tags[`class${schclass}`] == "true") ? true : false;
					let buttonText = notificationsEnabled ?
						'<i class="mdi mdi-bell-off"></i> Desative as notificações' :
						'<i class="mdi mdi-bell"></i> Ative as notificações';

					// Atualiza o botão
					$('#notifications').off('click', buttonClick);
					$('#notifications').on('click', buttonClick);
					$('#notifications').removeClass('btn-success btn-danger');
					$('#notifications').addClass(notificationsEnabled ? 'btn-danger' : 'btn-success');
					$('#notifications').html(buttonText);

					$('#notifications').prop('disabled', false);
					$('#notifications-container').collapse('show');
				});
			});
		}
	});
}

function getSubscriptionState() {
	return Promise.all([
		OneSignal.isPushNotificationsEnabled(),
		OneSignal.isOptedOut()
	]).then(result => {
		var isPushEnabled = result[0];
		var isOptedOut = result[1];

		return {
			isPushEnabled: isPushEnabled,
			isOptedOut: isOptedOut
		};
	});
}