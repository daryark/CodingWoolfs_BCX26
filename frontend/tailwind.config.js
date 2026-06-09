module.exports = {
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			colors: {
				bosch: {
					red: '#E00420',
					light: '#DFE2E4',
					medium: '#B6BBBE',
					gray: '#9DA5A8',
					dark: '#737A80',
					darker: '#31343A',
				},
				primary: {
					50: '#fef1f3',
					100: '#fce3e8',
					200: '#f9c7d1',
					300: '#f4a5b3',
					400: '#f07185',
					500: '#E00420',
					600: '#cc041d',
					700: '#ad0318',
					800: '#8e0215',
					900: '#750211',
				},
			},
			screens: {
				'sm': '640px',
				'md': '768px',
				'lg': '1024px',
				'xl': '1280px',
				'2xl': '1536px',
			},
		},
	},
	plugins: [],
}
