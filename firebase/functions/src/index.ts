import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import cors from 'cors';

// Initialize Firebase Admin
admin.initializeApp();

// CORS configuration
const corsHandler = cors({ origin: true });

// Import function modules
import { processCommand } from './commands';
import { generateContent } from './ai';
import { getCampaignData, saveMapState } from './campaign';

// Export Cloud Functions (2nd generation)
export const processCommandFunction = onRequest((req, res) => {
  corsHandler(req, res, () => processCommand(req, res));
});

export const generateContentFunction = onRequest((req, res) => {
  corsHandler(req, res, () => generateContent(req, res));
});

export const getCampaignDataFunction = onRequest((req, res) => {
  corsHandler(req, res, () => getCampaignData(req, res));
});

export const saveMapStateFunction = onRequest((req, res) => {
  corsHandler(req, res, () => saveMapState(req, res));
});
