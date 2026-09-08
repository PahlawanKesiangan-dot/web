import 'server-only';

import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

function firebaseAdminApp() {
  if (getApps().length) return getApp();

  const projectId = required('FIREBASE_PROJECT_ID');
  const clientEmail = required('FIREBASE_CLIENT_EMAIL');
  const privateKey = required('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n');

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    databaseURL: required('FIREBASE_DATABASE_URL'),
  });
}

export function adminAuth() {
  return getAuth(firebaseAdminApp());
}

export function adminDatabase() {
  return getDatabase(firebaseAdminApp());
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Environment variable ${name} belum dikonfigurasi.`);
  return value;
}
