export default [
	{
		ignores: ['dist'],
	},
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: 'module',
			parserOptions: {
				parser: '@typescript-eslint/parser',
				ecmaFeatures: {
					jsx: true,
				},
			},
			globals: {
				React: 'readonly',
			},
		},
		plugins: {
			'@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
			'react-hooks': require('eslint-plugin-react-hooks'),
			'react-refresh': require('eslint-plugin-react-refresh'),
		},
		rules: {
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
			'react-refresh/only-export-components': [
				'warn',
				{ allowConstantExport: true },
			],
		},
	},
]
