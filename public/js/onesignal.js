window.OneSignal = window.OneSignal || [];
OneSignal.push(function () {
	OneSignal.init({
		appId: "18b1561d-b987-451d-8838-ec933c470647",
		notifyButton: {
			enable: false
		},
		welcomeNotification: { // Desativa notificação de boas vindas
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
			$('#notifications-container').collapse('show');

			getSubscriptionState().then(state => {
				OneSignal.getTags().then(tags => {
					$('#notifications').prop('disabled', false);

					let buttonText = (state.isPushEnabled || !state.isOptedOut) && (tags && tags[`class${schclass}`] == "true") ?
						"Desative as notificações" : "Ative as notificações";
					
					// Atualiza o botão
					$('#notifications').off('click', buttonClick);
					$('#notifications').on('click', buttonClick);
					$('#notifications').text(buttonText);
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