import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';

// Initialize Firebase Admin
admin.initializeApp();

// CORS configuration
const corsHandler = cors({ origin: true });

// Import function modules
import { processCommand } from './commands';
import { generateContent } from './ai';
import { getCampaignData, saveMapState } from './campaign';

// Export Cloud Functions
export const processCommandFunction = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => processCommand(req, res));
});

export const generateContentFunction = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => generateContent(req, res));
});

export const getCampaignDataFunction = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => getCampaignData(req, res));
});

export const saveMapStateFunction = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => saveMapState(req, res));
});
