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
			},
			app: {
				title: 'Factory Worker Assistant',
				subtitle: 'AI-Powered Support for Machine Operations',
			},
			nav: {
				chat: 'Chat',
				voice: 'Voice',
				photo: 'Photo',
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
			},
			app: {
				title: 'Fabrik-Arbeit-Assistent',
				subtitle: 'KI-gestützte Unterstützung für Maschinenbetrieb',
			},
			nav: {
				chat: 'Chat',
				voice: 'Sprache',
				photo: 'Foto',
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
	lng: 'en',
	fallbackLng: 'en',
	interpolation: {
		escapeValue: false,
	},
})

export default i18n
