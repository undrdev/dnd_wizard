# AI TTRPG Campaign Wizard — User Stories

## 1. Campaign Management

### **US-001 — Create New Campaign from Scratch**

**As a** GM
**I want** to create a new campaign without providing an idea
**So that** the AI can generate a unique campaign concept for me.
**Acceptance Criteria:**

* User clicks "New Campaign" → chooses "AI Generate"
* AI returns campaign title, description, and map seed
* Campaign saved to Firestore if logged in

### **US-002 — Create New Campaign from Idea**

**As a** GM
**I want** to provide my own campaign idea
**So that** the AI can flesh it out into a detailed campaign.
**Acceptance Criteria:**

* User inputs campaign concept
* AI expands into locations, NPCs, and quests

### **US-003 — Save Campaign to Cloud**

**As a** GM
**I want** to store my campaign in the cloud
**So that** I can access it from any device.
**Acceptance Criteria:**

* Requires user login
* Saves campaign, NPCs, quests, map data to Firestore

---

## 2. Map Interaction

### **US-004 — View Interactive Map**

**As a** GM
**I want** to see my world as an interactive map
**So that** I can navigate between locations, NPCs, and quests.
**Acceptance Criteria:**

* Leaflet map with zoom levels
* Higher importance quests visible at further zooms

### **US-005 — Select NPC from Map**

**As a** GM
**I want** to click an NPC on the map
**So that** I can view their details, stats, and quests.
**Acceptance Criteria:**

* Map marker for NPC at their location
* Click opens NPC detail panel

### **US-006 — Select Quest from Map**

**As a** GM
**I want** to click a quest marker
**So that** I can view quest details and involved NPCs.
**Acceptance Criteria:**

* Quest marker visible on map
* Click shows quest detail panel

---

## 3. AI Interaction

### **US-007 — Give Commands to AI**

**As a** GM
**I want** to issue natural language commands to the AI
**So that** it can update my campaign.
**Acceptance Criteria:**

* Commands parsed into structured updates (new NPC, quest, location)
* AI updates Firestore and map in real-time

### **US-008 — Resume AI Context**

**As a** GM
**I want** the AI to remember the world state between sessions
**So that** it can give consistent answers.
**Acceptance Criteria:**

* AI context stored in Firestore
* Context loaded on new session

---

## 4. Data Export/Import

### **US-009 — Export Campaign to JSON**

**As a** GM
**I want** to export my entire campaign
**So that** I can store it offline or share it.
**Acceptance Criteria:**

* JSON file contains campaign, NPCs, quests, map seed, and AI context

### **US-010 — Import Campaign from JSON**

**As a** GM
**I want** to import a previously saved campaign
**So that** I can continue working on it.
**Acceptance Criteria:**

* Imported data restores map, NPCs, quests, and AI context
