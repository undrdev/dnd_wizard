Platform Decision Notes
The reasoning behind making it fully client-side when possible, and only introducing Firebase backend for auth/context persistence.
The benefit that users can plug in their own API keys for whichever AI provider they want.
That could be written as a short “Platform Strategy” section.
Value-Add Agent Behaviors
Earlier, we talked about the AI acting more like an autonomous campaign co-designer, not just a command executor — proactively suggesting updates, generating random encounters, creating dynamic story arcs, etc.
Some of that is hinted at in the agent personality, but not fully spelled out in terms of continuous background suggestions and session-long engagement.
Zoom-Level Quest Visibility Logic
We mentioned high-importance quests showing at higher zoom levels, but haven’t fully documented the map layer filtering rules anywhere except briefly in a user story.
Map Features Beyond Locations/NPCs/Quests
Things like water structures, terrain biomes, and landmarks are in our verbal plan but aren’t explicitly broken into data models or rendering logic.
Security / Privacy Notes
Since the plan is to let people use their own API keys, we should include a section on never storing API keys on the backend and keeping them in client storage only.