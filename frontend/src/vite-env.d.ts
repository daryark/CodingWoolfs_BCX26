/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_BEDROCK_API_ENDPOINT: string
	readonly VITE_BEDROCK_AGENT_ID: string
	readonly VITE_BEDROCK_AGENT_ALIAS_ID: string
	readonly VITE_AWS_REGION: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
