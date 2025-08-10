# AI TTRPG Campaign Wizard

An AI-powered tool for creating and managing tabletop RPG campaigns with interactive maps, NPCs, and quests.

## Features

- 🗺️ Interactive map with Leaflet.js
- 🤖 AI-powered campaign generation
- 👥 NPC management and tracking
- 📋 Quest system with importance levels
- 🔥 Firebase backend for persistence
- 📱 Responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Map**: Leaflet.js with React Leaflet
- **State Management**: Zustand
- **Styling**: Tailwind CSS + Headless UI
- **Backend**: Firebase (Auth, Firestore, Functions, Storage)
- **AI**: OpenAI GPT-4 / Anthropic Claude

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up Firebase configuration (see Firebase Configuration section)

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── components/          # React components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries and configurations
├── pages/              # Next.js pages
├── stores/             # Zustand state stores
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── firebase/           # Firebase Cloud Functions
```

## Firebase Configuration

1. Create a Firebase project
2. Enable Authentication, Firestore, Storage, and Functions
3. Copy your Firebase config to `lib/firebase.ts`
4. Set up environment variables for API keys

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run export` - Export static files
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

## User Stories

See `user_stories.md` for detailed feature requirements and acceptance criteria.

## Architecture

See `architecture_and_dataflow.md` for system architecture and data flow documentation.
