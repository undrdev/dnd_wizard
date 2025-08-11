import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp, getApps } from 'firebase-admin/app';
import cors from 'cors';

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp();
}

// CORS configuration
const corsHandler = cors({ origin: true });

// Import function modules
import { processCommand } from './commands.js';
import { generateContent } from './ai.js';
import { getCampaignData, saveMapState } from './campaign.js';

// Export Cloud Functions (2nd generation)
export const processCommandFunction = onRequest({
  cors: true,
  region: 'us-central1'
}, (req, res) => {
  corsHandler(req, res, () => processCommand(req, res));
});

export const generateContentFunction = onRequest({
  cors: true,
  region: 'us-central1'
}, (req, res) => {
  corsHandler(req, res, () => generateContent(req, res));
});

export const getCampaignDataFunction = onRequest({
  cors: true,
  region: 'us-central1'
}, (req, res) => {
  corsHandler(req, res, () => getCampaignData(req, res));
});

export const saveMapStateFunction = onRequest({
  cors: true,
  region: 'us-central1'
}, (req, res) => {
  corsHandler(req, res, () => saveMapState(req, res));
});
