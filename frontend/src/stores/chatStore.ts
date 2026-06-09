import { create } from 'zustand'

export interface ChatMessage {
	id: string
	role: 'user' | 'assistant'
	content: string
	timestamp: Date
	imageUrl?: string
}

export interface ChatStore {
	messages: ChatMessage[]
	sessionId: string
	currentLanguage: 'en' | 'de'
	isLoading: boolean
	error: string | null

	// Actions
	addMessage: (role: 'user' | 'assistant', content: string, imageUrl?: string) => void
	clearMessages: () => void
	setLanguage: (language: 'en' | 'de') => void
	setLoading: (loading: boolean) => void
	setError: (error: string | null) => void
	resetSession: () => void
}

function generateId(): string {
	return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

function generateSessionId(): string {
	return `session-${Date.now()}`
}

export const useChatStore = create<ChatStore>((set) => ({
	messages: [],
	sessionId: generateSessionId(),
	currentLanguage: 'en',
	isLoading: false,
	error: null,

	addMessage: (role, content, imageUrl) => {
		set((state) => ({
			messages: [
				...state.messages,
				{
					id: generateId(),
					role,
					content,
					timestamp: new Date(),
					imageUrl,
				},
			],
		}))
	},

	clearMessages: () => {
		set({
			messages: [],
			error: null,
		})
	},

	setLanguage: (language) => {
		set({ currentLanguage: language })
	},

	setLoading: (loading) => {
		set({ isLoading: loading })
	},

	setError: (error) => {
		set({ error })
	},

	resetSession: () => {
		set({
			sessionId: generateSessionId(),
			messages: [],
			error: null,
		})
	},
}))
