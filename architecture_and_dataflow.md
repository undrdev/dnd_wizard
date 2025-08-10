# AI TTRPG Campaign Wizard — Architecture & Data Flow

## 1. High-Level Architecture

### **Frontend (Client-Side)**

* **Framework:** Next.js (Static Export) or Vite + React
* **State Management:** Zustand for lightweight global state
* **Map Rendering:** Leaflet.js (interactive map with NPCs, quests, and landmarks)
* **Direct AI Calls:** Browser → AI provider API using user-provided API key (stored locally)
* **Offline Storage:** localStorage / IndexedDB for temporary campaign state

### **Backend (Firebase)**

* **Auth:** Firebase Authentication (OAuth, email/password)
* **Database:** Firestore for campaign data, NPCs, quests, and AI session context
* **Storage:** Firebase Storage for generated map images, NPC portraits, handouts
* **Functions:** Cloud Functions for:

  * Context preprocessing before AI calls
  * Handling structured commands from user
  * Optional AI proxy if provider CORS blocks direct client calls

### **AI Provider**

* Receives structured context from Cloud Functions
* Processes commands or freeform requests
* Returns structured JSON for integration into map and UI

---

## 2. Data Flow

### **Step 1 — Initialization**

1. User loads the static frontend from CDN
2. App checks for stored API key & campaign in localStorage or Firestore

### **Step 2 — Campaign Creation**

1. User inputs idea or asks AI to generate one
2. Cloud Function assembles world state context
3. AI generates campaign JSON (world map seed, NPCs, quests, lore)
4. Client renders map and populates NPC/quest layers

### **Step 3 — Persistent AI Context**

* Firestore stores AI memory tokens & structured world data
* Context builder retrieves relevant chunks for each AI request

### **Step 4 — Interactive Map Updates**

* When new NPC/quest/location is added:

  * AI assigns map coordinates
  * Client updates Leaflet layer
  * Firestore syncs updated object

### **Step 5 — Offline & Export**

* User can export campaign JSON locally
* Import restores exact AI memory & map state

---

## 3. Security Model

* API keys stored locally unless explicitly saved encrypted in Firestore
* All AI calls authenticated directly to provider or via secure Cloud Function
* Firestore rules ensure only campaign owner can modify their data
