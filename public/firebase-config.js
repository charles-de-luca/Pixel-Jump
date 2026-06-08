/* 
 *  Copyright 2026 Charles DeLuca
 *  
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  
 *      http://www.apache.org/licenses/LICENSE-2.0
 *  
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

/**
 * Firebase configuration for UPLOOP game
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged, getIdToken } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, updateDoc, increment, query, where, getDocs, orderBy, limit, collection } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration - replace with your actual config
// IMPORTANT: These values should be replaced with real Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyC5CiOBSADkEqp5HN8-NjNxSDGQsgOciJs",
  authDomain: "pixel-jump-web.firebaseapp.com",
  projectId: "pixel-jump-web",
  storageBucket: "pixel-jump-web.firebasestorage.app",
  // Temporary security rule expiration extended to 30 days for development
  // In production, implement proper authentication and security rules
  messagingSenderId: "892436157186",
  appId: "1:892436157186:web:21fbfe210cd39b6df0a81b",
  measurementId: "G-ER971X0YMS"
};

// Initialize Firebase
let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error('Firebase App init error', error);
}

// Initialize Auth (fail safely)
try {
  if (app) {
    auth = getAuth(app);
  }
} catch (error) {
  console.warn('Firebase Auth init error:', error.code || error.message);
}

// Initialize Firestore (independent of Auth)
try {
  if (app) {
    db = getFirestore(app);
  }
} catch (error) {
  console.error('Firebase Firestore init error', error);
}

// Initialize Firebase authentication and database
export { auth, db };

// Expose to window for legacy scripts (like settings-skins.js)
window.db = db;
window.auth = auth;
window.doc = doc;
window.setDoc = setDoc;
window.getDoc = getDoc;

// Function to initialize Firebase and authenticate user
export async function initFirebase() {
  try {
    // Check if Firebase is properly configured
    if (!auth) {
      console.warn('Firebase not initialized, skipping authentication');
      return null;
    }

    // Sign in anonymously
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;
    console.log('Firebase authenticated user:', user.uid);

    // Store user ID in global scope for later use
    globalThis.firebaseUserId = user.uid;

    return user;
  } catch (error) {
    if (error.code === 'auth/configuration-not-found') {
      console.log('Firebase Auth skipped (Configuration not found). Playing offline mode.');
    } else {
      console.log('Firebase Auth skipped:', error.message);
    }
    // Don't throw - allow game to continue without Firebase
    return null;
  }
}
