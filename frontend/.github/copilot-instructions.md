# Copilot Instructions for Factory Worker Assistant Frontend

## Project Overview

This is a modern React TypeScript frontend application for a factory worker assistant with voice, chat, and photo analysis capabilities, integrated with AWS Bedrock AgentCore.

## Completed Setup Checklist

✅ **Clarify Project Requirements** - Completed
- Frontend for factory worker assistant
- Voice, chat, and photo upload capabilities
- Multi-language support (English & German)
- Responsive tablet and phone UI
- AWS Bedrock AgentCore integration

✅ **Scaffold the Project** - Completed
- React 18 + TypeScript
- Vite build system
- Tailwind CSS styling
- i18next for internationalization
- Zustand for state management
- Project structure established

✅ **Customize the Project** - Completed
- Created 5 main components (ChatTab, VoiceTab, PhotoTab, MessageBubble, LanguageSwitcher)
- Implemented Bedrock AgentCore client
- Voice assistant with Web Speech API
- Multi-language translations
- Responsive design system

✅ **Compile the Project** - Ready for Installation
- All TypeScript configurations in place
- ESLint configuration ready
- Build scripts configured

## Installation & Running

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm run preview
```

### Linting
```bash
npm run lint
```

## Environment Configuration

Create `.env.local` in the project root:
```env
VITE_BEDROCK_API_ENDPOINT=https://your-bedrock-endpoint.amazonaws.com
VITE_BEDROCK_AGENT_ID=your-agent-id
VITE_BEDROCK_AGENT_ALIAS_ID=your-agent-alias-id
VITE_AWS_REGION=us-east-1
```

## Project Structure

```
src/
├── components/        # React components
│   ├── ChatTab.tsx
│   ├── VoiceTab.tsx
│   ├── PhotoTab.tsx
│   ├── MessageBubble.tsx
│   └── LanguageSwitcher.tsx
├── stores/           # Zustand state management
│   └── chatStore.ts
├── utils/            # Utilities and integrations
│   ├── bedrock.ts    # AWS Bedrock client
│   └── voiceAssistant.ts
├── App.tsx           # Main component
├── main.tsx          # Entry point
├── i18n.ts           # Internationalization
└── index.css         # Global styles
```

## Key Features Implemented

### Components
- **ChatTab**: Text-based conversation interface
- **VoiceTab**: Voice input with Web Speech API
- **PhotoTab**: Image upload and analysis
- **LanguageSwitcher**: EN/DE language toggle
- **MessageBubble**: Reusable message display

### Services
- **Bedrock Client**: AWS AgentCore integration
- **Voice Assistant**: Speech recognition and synthesis
- **Chat Store**: Zustand state management

### Styling
- Tailwind CSS with custom primary color palette
- Mobile-first responsive design
- Dark/light mode ready
- Accessibility optimized

## Browser Support

- Chrome/Edge: Full support
- Safari: Full support
- Firefox: Limited voice support

## Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## Next Steps for User

1. Install dependencies: `npm install`
2. Configure `.env.local` with Bedrock credentials
3. Run development server: `npm run dev`
4. Access at http://localhost:5173
5. Test all three features (Chat, Voice, Photo)

## Troubleshooting

- **Module not found errors**: Run `npm install`
- **Voice not working**: Check browser microphone permissions
- **Bedrock connection issues**: Verify API endpoint and credentials
- **Build errors**: Clear `node_modules` and reinstall

## Documentation

- See README.md for detailed documentation
- Check src/utils files for API integration details
- Review tailwind.config.js for style customization
