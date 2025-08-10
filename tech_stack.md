# AI TTRPG Campaign Wizard — Technical Specification

## 1. Tech Stack

### **Frontend**

* **Framework:** Next.js (SSG for static hosting) or Vite + React
* **Map Rendering:** Leaflet.js with custom layers for NPCs, quests, terrain
* **State Management:** Zustand (lightweight global store)
* **UI Library:** Tailwind CSS + Headless UI for modals, dropdowns
* **Local Storage:** localStorage / IndexedDB for quick session data

### **Backend**

* **Platform:** Firebase

  * **Authentication:** Email/password, Google, GitHub OAuth
  * **Database:** Firestore for structured campaign data and AI context memory
  * **Storage:** Firebase Storage for generated images and assets
  * **Cloud Functions:** Node.js runtime for AI request preprocessing and command handling
* **AI Provider:** OpenAI API (GPT-4o / GPT-4 Turbo) or Anthropic Claude

---

## 2. Data Models

### **Campaign**

```json
{
  "id": "string",
  "ownerId": "string",
  "title": "string",
  "description": "string",
  "mapSeed": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### **Location**

```json
{
  "id": "string",
  "campaignId": "string",
  "name": "string",
  "type": "city|village|landmark|dungeon",
  "coords": { "lat": "number", "lng": "number" },
  "description": "string",
  "npcs": ["npcId"],
  "quests": ["questId"]
}
```

### **NPC**

```json
{
  "id": "string",
  "campaignId": "string",
  "name": "string",
  "role": "string",
  "locationId": "string",
  "personality": "string",
  "stats": { },
  "quests": ["questId"]
}
```

### **Quest**

```json
{
  "id": "string",
  "campaignId": "string",
  "title": "string",
  "description": "string",
  "importance": "low|medium|high",
  "status": "active|completed|failed",
  "startNpcId": "string",
  "involvedNpcIds": ["npcId"],
  "locationIds": ["locationId"]
}
```

### **AI Context Memory**

```json
{
  "campaignId": "string",
  "tokens": ["string"],
  "lastUpdated": "timestamp"
}
```

---

## 3. API Endpoints (Firebase Cloud Functions)

* `POST /processCommand` — parses structured commands and updates Firestore
* `POST /generateContent` — sends AI context + request to AI provider
* `GET /campaign/:id` — retrieves campaign data and map info
* `POST /saveMapState` — stores updated map layers

---

## 4. Integration Flow

1. **Frontend → Cloud Function:** Command or freeform request
2. **Cloud Function:** Pull relevant context from Firestore
3. **Cloud Function → AI Provider:** Sends structured context & request
4. **AI Provider → Cloud Function:** Returns JSON
5. **Cloud Function → Firestore:** Updates world state
6. **Firestore → Frontend:** Realtime update to map/UI

---

## 5. Deployment & Hosting

* **Hosting:** Firebase Hosting for frontend
* **Functions:** Firebase Functions (Node.js 20)
* **CDN:** Built-in Firebase CDN for fast asset delivery
