# DnD Wizard Setup Guide

This guide will help you set up the DnD Wizard application for development and deployment.

## Prerequisites

- Node.js 18+ and npm
- Firebase account
- AI provider account (OpenAI or Anthropic)

## 1. Initial Setup

### Clone and Install Dependencies

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
```

### Install Leaflet Assets

```bash
# Copy Leaflet marker icons to public directory
mkdir -p public/leaflet
cp node_modules/leaflet/dist/images/* public/leaflet/
```

## 2. Firebase Configuration

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable the following services:
   - Authentication (Email/Password, Google, GitHub)
   - Firestore Database
   - Storage
   - Functions

### Configure Authentication

1. In Firebase Console → Authentication → Sign-in method
2. Enable:
   - Email/Password
   - Google (optional)
   - GitHub (optional)

### Set up Firestore

1. Create Firestore database in production mode
2. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Configure Environment Variables

Edit `.env.local` with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 3. Firebase Functions Setup

### Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase init
```

### Deploy Functions

```bash
cd firebase/functions
npm install
npm run build
cd ../..
firebase deploy --only functions
```

## 4. Development

### Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Development Workflow

1. **Frontend Development**: Edit files in `components/`, `pages/`, `stores/`
2. **Backend Development**: Edit Firebase Functions in `firebase/functions/src/`
3. **Styling**: Modify `styles/globals.css` and Tailwind classes
4. **Types**: Update TypeScript types in `types/index.ts`

## 5. AI Provider Setup

### OpenAI Setup

1. Get API key from [OpenAI Platform](https://platform.openai.com/)
2. In the app, go to AI Settings and configure:
   - API Key: `sk-...`
   - Model: `gpt-4` (recommended)

### Anthropic Setup

1. Get API key from [Anthropic Console](https://console.anthropic.com/)
2. In the app, go to AI Settings and configure:
   - API Key: `sk-ant-...`
   - Model: `claude-3-sonnet` (recommended)

## 6. Deployment

### Build for Production

```bash
npm run build
npm run export
```

### Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

### Deploy Everything

```bash
firebase deploy
```

## 7. User Stories Implementation

The skeleton provides the foundation for implementing the user stories:

### Completed Foundation
- ✅ Project setup and configuration
- ✅ Firebase integration (Auth, Firestore, Functions)
- ✅ State management with Zustand
- ✅ Authentication system
- ✅ Interactive map with Leaflet
- ✅ Campaign management UI
- ✅ AI integration layer
- ✅ Core data models and types

### Ready for Implementation
- 🔄 **US-001**: Create New Campaign from Scratch
- 🔄 **US-002**: Create New Campaign from Idea  
- 🔄 **US-003**: Save Campaign to Cloud
- 🔄 **US-004**: View Interactive Map
- 🔄 **US-005**: Select NPC from Map
- 🔄 **US-006**: Select Quest from Map
- 🔄 **US-007**: Give Commands to AI
- 🔄 **US-008**: Resume AI Context
- 🔄 **US-009**: Export Campaign to JSON
- 🔄 **US-010**: Import Campaign from JSON

## 8. Development Tasks for Remote Agents

### High Priority Tasks

1. **Complete AI Integration** (`components/ai/`)
   - Implement actual AI API calls
   - Add structured response parsing
   - Handle AI-generated content creation

2. **Implement Data Persistence** (`lib/firestore.ts`)
   - Complete CRUD operations
   - Add real-time listeners
   - Implement offline support

3. **Enhanced Map Features** (`components/map/`)
   - Add terrain layers
   - Implement custom map tiles
   - Add drawing tools

4. **Import/Export System** (`lib/`)
   - JSON export/import functionality
   - Campaign sharing features
   - Backup/restore capabilities

### Medium Priority Tasks

5. **NPC Management** (`components/npc/`)
   - Detailed NPC forms
   - Portrait upload/generation
   - Relationship tracking

6. **Quest System** (`components/quest/`)
   - Quest dependency tracking
   - Progress monitoring
   - Reward management

7. **Location Details** (`components/location/`)
   - Rich location descriptions
   - Image attachments
   - Sub-location support

### Low Priority Tasks

8. **Advanced AI Features**
   - Context-aware suggestions
   - Automated world building
   - Dynamic story generation

9. **Collaboration Features**
   - Multi-user campaigns
   - Real-time collaboration
   - Permission management

10. **Mobile Optimization**
    - Responsive design improvements
    - Touch-friendly interactions
    - Offline capabilities

## 9. Testing

### Run Tests

```bash
npm run test        # Unit tests
npm run test:e2e    # End-to-end tests
npm run lint        # Linting
npm run type-check  # TypeScript checking
```

### Test Coverage

- Authentication flows
- Campaign CRUD operations
- Map interactions
- AI integration
- Data persistence

## 10. Troubleshooting

### Common Issues

1. **Firebase Connection**: Check environment variables
2. **Map Not Loading**: Verify Leaflet assets are copied
3. **AI Not Working**: Confirm API keys are configured
4. **Build Errors**: Run `npm run type-check` for TypeScript issues

### Debug Mode

Set `NODE_ENV=development` for detailed logging and error messages.

## Next Steps

1. Set up the development environment
2. Configure Firebase and AI providers
3. Assign user stories to remote agents
4. Implement features incrementally
5. Test and deploy

The skeleton provides a solid foundation for rapid development by remote agents working on specific user stories.
