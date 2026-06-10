import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
	en: {
		translation: {
			common: {
				language: 'English',
				loading: 'Loading...',
				error: 'Error',
				success: 'Success',
				send: 'Send',
				clear: 'Clear',
				cancel: 'Cancel',
				close: 'Close',
				back: 'Back',
			},
			app: {
				title: 'MachineWhisperer',
			},
			nav: {
				chat: 'Chat',
				voice: 'Voice',
				photo: 'Photo',
			},
			machines: {
				title: 'Machines',
				working: 'Working',
				error: 'Error',
				online: 'Online',
				offline: 'Offline',
				machineDetails: 'Machine Details',
				controller: 'Controller',
				installYear: 'Install year',
				nextMaintenance: 'Next maintenance',
				serial: 'Serial',
				lastUpdate: 'Last update',
				eventLog: 'Event Log',
				noEvents: 'No events recorded for this machine.',
				clickReport: 'Click any row with a 📄 icon to open its incident report.',
				startAssistant: 'Start Assistant',
				startChat: 'Start Chat',
				failedToLoad: 'Failed to load machines.',
				viewReport: 'View incident report',
				time: {
					justNow: 'Just now',
					'1min': '1 min ago',
					'2min': '2 min ago',
					'3min': '3 min ago',
					'4min': '4 min ago',
					'5min': '5 min ago',
				},
			},
			report: {
				title: 'Incident Report',
				issue: 'Issue',
				whatWasTried: 'What Was Tried',
				solution: 'Solution',
				resolvedAt: 'Resolved at',
			},
			chat: {
				placeholder: 'Type your question here...',
				sendMessage: 'Send Message',
				clearHistory: 'Clear History',
				noMessages: 'No messages yet. Start a conversation!',
				errorSending: 'Failed to send message. Please try again.',
				language: 'Language',
			},
			voice: {
				startListening: 'Start Listening',
				stopListening: 'Stop Listening',
				listening: 'Listening...',
				processing: 'Processing your request...',
				errorMicrophone: 'Microphone access denied. Please check browser permissions.',
				notSupported: 'Voice assistant is not supported in your browser.',
			},
			photo: {
				uploadPhoto: 'Upload Photo',
				takePhoto: 'Take Photo',
				selectFile: 'Select File',
				uploading: 'Uploading...',
				analyzing: 'Analyzing image...',
				errorUpload: 'Failed to upload photo. Please try again.',
				noResults: 'No results found. Please try another image.',
			},
			assistant: {
				responseTitle: 'Assistant Response',
				errorCode: 'Error Code',
				solution: 'Solution',
				steps: 'Steps to Fix',
				details: 'Details',
			},
		},
	},
	de: {
		translation: {
			common: {
				language: 'Deutsch',
				loading: 'Wird geladen...',
				error: 'Fehler',
				success: 'Erfolg',
				send: 'Senden',
				clear: 'Löschen',
				cancel: 'Abbrechen',
				close: 'Schließen',
				back: 'Zurück',
			},
			app: {
				title: 'MachineWhisperer',
			},
			nav: {
				chat: 'Chat',
				voice: 'Sprache',
				photo: 'Foto',
			},
			machines: {
				title: 'Maschinen',
				working: 'In Betrieb',
				error: 'Fehler',
				online: 'Online',
				offline: 'Offline',
				machineDetails: 'Maschinendetails',
				controller: 'Steuerung',
				installYear: 'Baujahr',
				nextMaintenance: 'Nächste Wartung',
				serial: 'Seriennummer',
				lastUpdate: 'Letzte Aktualisierung',
				eventLog: 'Ereignisprotokoll',
				noEvents: 'Keine Ereignisse für diese Maschine aufgezeichnet.',
				clickReport: 'Klicken Sie auf eine Zeile mit 📄 Symbol, um den Bericht zu öffnen.',
				startAssistant: 'Assistent starten',
				startChat: 'Chat starten',
				failedToLoad: 'Maschinen konnten nicht geladen werden.',
				viewReport: 'Störungsbericht anzeigen',
				time: {
					justNow: 'Gerade eben',
					'1min': 'vor 1 Min.',
					'2min': 'vor 2 Min.',
					'3min': 'vor 3 Min.',
					'4min': 'vor 4 Min.',
					'5min': 'vor 5 Min.',
				},
			},
			report: {
				title: 'Störungsbericht',
				issue: 'Problem',
				whatWasTried: 'Was versucht wurde',
				solution: 'Lösung',
				resolvedAt: 'Behoben um',
			},
			chat: {
				placeholder: 'Geben Sie Ihre Frage hier ein...',
				sendMessage: 'Nachricht senden',
				clearHistory: 'Verlauf löschen',
				noMessages: 'Noch keine Nachrichten. Starten Sie ein Gespräch!',
				errorSending: 'Fehler beim Senden der Nachricht. Bitte versuchen Sie es erneut.',
				language: 'Sprache',
			},
			voice: {
				startListening: 'Zuhören starten',
				stopListening: 'Zuhören beenden',
				listening: 'Höre zu...',
				processing: 'Verarbeite deine Anfrage...',
				errorMicrophone: 'Mikrofonzugriff verweigert. Bitte überprüfen Sie die Browser-Berechtigungen.',
				notSupported: 'Der Sprachassistent wird in Ihrem Browser nicht unterstützt.',
			},
			photo: {
				uploadPhoto: 'Foto hochladen',
				takePhoto: 'Foto machen',
				selectFile: 'Datei wählen',
				uploading: 'Wird hochgeladen...',
				analyzing: 'Analysiere Bild...',
				errorUpload: 'Fehler beim Hochladen des Fotos. Bitte versuchen Sie es erneut.',
				noResults: 'Keine Ergebnisse gefunden. Bitte versuchen Sie ein anderes Bild.',
			},
			assistant: {
				responseTitle: 'Assistent-Antwort',
				errorCode: 'Fehlercode',
				solution: 'Lösung',
				steps: 'Schritte zum Beheben',
				details: 'Details',
			},
		},
	},
}

i18n.use(initReactI18next).init({
	resources,
	lng: localStorage.getItem('language') || 'en',
	fallbackLng: 'en',
	interpolation: {
		escapeValue: false,
	},
})

// Persist language choice on change
i18n.on('languageChanged', (lng) => {
	localStorage.setItem('language', lng)
})

export default i18n
