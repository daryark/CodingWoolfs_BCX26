import axios, { AxiosInstance } from 'axios'

interface BedrockConfig {
	apiEndpoint: string
	agentId: string
	agentAliasId: string
	region: string
}

interface AgentResponse {
	responseText: string
	citations?: string[]
	metadata?: Record<string, unknown>
}

class BedrockClient {
	private client: AxiosInstance
	private config: BedrockConfig

	constructor(config: BedrockConfig) {
		this.config = config
		this.client = axios.create({
			baseURL: config.apiEndpoint,
			timeout: 30000,
			headers: {
				'Content-Type': 'application/json',
			},
		})
	}

	async sendMessage(userInput: string, sessionId: string): Promise<AgentResponse> {
		try {
			const response = await this.client.post('/agents/action', {
				agentId: this.config.agentId,
				agentAliasId: this.config.agentAliasId,
				sessionId,
				inputText: userInput,
			})

			return {
				responseText: response.data.output || response.data.response,
				citations: response.data.citations,
				metadata: response.data.metadata,
			}
		} catch (error) {
			if (axios.isAxiosError(error)) {
				throw new Error(`Failed to communicate with Bedrock: ${error.message}`)
			}
			throw error
		}
	}

	async analyzeImage(
		imageBase64: string,
		imageFormat: string,
		userQuery: string,
		sessionId: string
	): Promise<AgentResponse> {
		try {
			const response = await this.client.post('/agents/action', {
				agentId: this.config.agentId,
				agentAliasId: this.config.agentAliasId,
				sessionId,
				inputText: userQuery,
				files: [
					{
						name: `image.${imageFormat}`,
						data: imageBase64,
						mimeType: `image/${imageFormat}`,
					},
				],
			})

			return {
				responseText: response.data.output || response.data.response,
				citations: response.data.citations,
				metadata: response.data.metadata,
			}
		} catch (error) {
			if (axios.isAxiosError(error)) {
				throw new Error(`Failed to analyze image: ${error.message}`)
			}
			throw error
		}
	}

	async sendVoiceTranscript(transcript: string, sessionId: string): Promise<AgentResponse> {
		return this.sendMessage(transcript, sessionId)
	}
}

export { BedrockClient }
export type { BedrockConfig, AgentResponse }

// Factory function to create client with environment variables or custom config
export function createBedrockClient(customConfig?: Partial<BedrockConfig>): BedrockClient {
	const config: BedrockConfig = {
		apiEndpoint: customConfig?.apiEndpoint || import.meta.env.VITE_BEDROCK_API_ENDPOINT || 'http://localhost:8000',
		agentId: customConfig?.agentId || import.meta.env.VITE_BEDROCK_AGENT_ID || '',
		agentAliasId: customConfig?.agentAliasId || import.meta.env.VITE_BEDROCK_AGENT_ALIAS_ID || '',
		region: customConfig?.region || import.meta.env.VITE_AWS_REGION || 'us-east-1',
	}

	return new BedrockClient(config)
}
