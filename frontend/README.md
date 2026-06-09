# Factory Worker Assistant - Frontend

A modern, responsive React TypeScript web application that provides factory workers with AI-powered assistance through voice, chat, and image analysis capabilities. Built with AWS Bedrock AgentCore integration, Tailwind CSS, and optimized for both mobile and tablet devices.

## 🎯 Features

### Core Functionality
- **Chat Assistant**: Text-based Q&A with multi-turn conversation support
- **Voice Assistant**: Hands-free voice input and audio responses using Web Speech API
- **Photo Analysis**: Upload or capture photos of error codes for instant analysis
- **Multi-language Support**: Full English and German language support

### Technical Highlights
- **Responsive Design**: Optimized for phones, tablets, and desktops
- **Real-time Processing**: Instant feedback and streaming responses
- **AWS Bedrock Integration**: Powered by RAG and machine documentation
- **Offline-Ready**: Progressive web app capabilities
- **Type-Safe**: Full TypeScript implementation with strict mode
- **Modern Stack**: React 18, Vite, Tailwind CSS, Zustand

## 📦 Project Structure

```
src/
├── components/
│   ├── ChatTab.tsx           # Chat interface component
│   ├── VoiceTab.tsx          # Voice input component
│   ├── PhotoTab.tsx          # Image upload and analysis
│   ├── MessageBubble.tsx      # Reusable message component
│   └── LanguageSwitcher.tsx   # Language selection
├── stores/
│   └── chatStore.ts          # Zustand state management
├── utils/
│   ├── bedrock.ts            # AWS Bedrock client
│   └── voiceAssistant.ts     # Web Speech API wrapper
├── App.tsx                   # Main application component
├── main.tsx                  # React DOM entry point
├── i18n.ts                   # i18next configuration
└── index.css                 # Global Tailwind styles
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or npm 9+
- Modern browser with Web Speech API support (Chrome, Edge, Safari)
- AWS Bedrock AgentCore endpoint and credentials

### Installation

1. **Clone the repository**
```bash
cd frontend
npm install
```

2. **Configure environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your AWS Bedrock configuration:
```env
VITE_BEDROCK_API_ENDPOINT=https://your-bedrock-endpoint.amazonaws.com
VITE_BEDROCK_AGENT_ID=your-agent-id
VITE_BEDROCK_AGENT_ALIAS_ID=your-agent-alias-id
VITE_AWS_REGION=us-east-1
```

3. **Start development server**
```bash
npm run dev
```

The application will open at `http://localhost:5173`

## 🛠️ Available Scripts

### Development
```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
```

## 🌐 Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome  | ✅ Full | All features supported |
| Edge    | ✅ Full | All features supported |
| Safari  | ✅ Full | Voice API supported |
| Firefox | ⚠️ Limited | Voice recognition requires flag |

## 🔧 Configuration

### AWS Bedrock Setup

1. **Create an Agent in AWS Bedrock Console**
   - Navigate to Bedrock → Agents
   - Create new agent with RAG enabled
   - Configure knowledge base with factory documentation
   - Deploy agent and copy Agent ID and Alias ID

2. **API Endpoint**
   - Use AWS SDK for JavaScript or your custom API Gateway
   - Ensure CORS headers allow frontend domain

3. **IAM Permissions**
   - Ensure service has `bedrock:InvokeAgent` permissions
   - Allow access to knowledge bases

## 🎨 Customization

### Styling
- Modify `tailwind.config.js` for color schemes and breakpoints
- Colors use CSS custom properties for easy theming
- Responsive breakpoints: `sm` (640px), `md` (768px), `lg` (1024px)

### Languages
Edit `src/i18n.ts` to add new languages or modify translations

### Voice Settings
Configure voice recognition in `src/utils/voiceAssistant.ts`:
- Language: `de-DE`, `en-US`, etc.
- Continuous mode for longer sessions
- Interim results for real-time feedback

## 📱 Responsive Breakpoints

- **Mobile**: < 640px (Single column, touch optimized)
- **Tablet**: 640px - 1024px (Two column, optimized layout)
- **Desktop**: > 1024px (Full width, maximum features)

## 🔐 Security Considerations

1. **API Credentials**: Never commit `.env` files
2. **Content Security**: Image uploads validated client-side
3. **HTTPS Only**: Use secure connections in production
4. **CORS**: Configure properly for your deployment domain
5. **Rate Limiting**: Implement on Bedrock API side

## 🐛 Troubleshooting

### Voice Not Working
- Check browser permissions for microphone
- Ensure HTTPS in production
- Test in Chrome/Edge first

### Bedrock Connection Issues
- Verify API endpoint is accessible
- Check AWS credentials and region
- Review CloudWatch logs

### Image Upload Fails
- Ensure file is valid image format
- Check file size limits
- Verify browser file API support

## 📖 API Documentation

### Bedrock Client

```typescript
const client = createBedrockClient({
  apiEndpoint: 'https://your-endpoint',
  agentId: 'agent-123',
  agentAliasId: 'alias-456'
})

// Send text message
const response = await client.sendMessage(userInput, sessionId)

// Analyze image
const imageResponse = await client.analyzeImage(
  base64Image,
  'png',
  userQuery,
  sessionId
)
```

### Voice Assistant

```typescript
const assistant = new VoiceAssistant({ language: 'en-US' })

assistant.setTranscriptCallback((text, isFinal) => {
  // Handle transcript
})

assistant.start()
assistant.stop()
```

## 🤝 Contributing

Contributions are welcome! Please ensure:
- TypeScript strict mode compliance
- ESLint rules pass
- Mobile responsiveness maintained
- i18n strings updated for both languages

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

For issues or questions:
1. Check browser console for errors
2. Verify environment configuration
3. Review AWS Bedrock documentation
4. Check network tab for API calls

## 🔄 Version History

### v0.1.0 (Initial Release)
- Chat interface with message history
- Voice input and audio responses
- Photo upload and analysis
- Multi-language support (EN/DE)
- Responsive mobile/tablet/desktop UI
- AWS Bedrock AgentCore integration
- State management with Zustand
- Tailwind CSS styling

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [AWS Bedrock](https://docs.aws.amazon.com/bedrock/)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
