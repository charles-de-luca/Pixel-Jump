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

// Function to check if user is authenticated
export function isFirebaseAuthenticated() {
  return globalThis.firebaseUserId !== undefined;
}

// Function to get current user ID
export function getCurrentUserId() {
  return globalThis.firebaseUserId;
}

// Function to save high score to Firestore
export async function saveHighScoreToFirestore(score) {
  if (!isFirebaseAuthenticated()) {
    console.error('User not authenticated for Firestore operation');
    return false;
  }

  try {
    const userId = getCurrentUserId();
    const userDocRef = doc(db, 'users', userId);

    // Get current document to check if we need to update high score
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.exists() ? userDoc.data() : {};
    const currentHighScore = userData.highScore || 0;

    // Only update if new score is higher
    if (score > currentHighScore) {
      await setDoc(userDocRef, {
        highScore: score,
        lastPlayed: new Date().toISOString(),
        totalGames: userData.totalGames ? increment(1) : 1
      }, { merge: true });

      console.log('High score saved to Firestore:', score);
      return true;
    } else {
      console.log('Score not higher than current high score, not updating');
      return false;
    }
  } catch (error) {
    console.error('Error saving high score to Firestore:', error);
    return false;
  }
}

// Function to get high score from Firestore
export async function getHighScoreFromFirestore() {
  if (!isFirebaseAuthenticated()) {
    console.error('User not authenticated for Firestore operation');
    return 0;
  }

  try {
    const userId = getCurrentUserId();
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.highScore || 0;
    } else {
      // Create user document if it doesn't exist
      await setDoc(userDocRef, {
        highScore: 0,
        totalGames: 0,
        createdAt: new Date().toISOString()
      });
      return 0;
    }
  } catch (error) {
    console.error('Error getting high score from Firestore:', error);
    return 0;
  }
}

// Function to save game statistics to Firestore
export async function saveGameStats(stats) {
  if (!isFirebaseAuthenticated()) {
    console.error('User not authenticated for Firestore operation');
    return false;
  }

  try {
    const userId = getCurrentUserId();
    const statsDocRef = doc(db, 'gameStats', userId);

    // Update game statistics
    await setDoc(statsDocRef, {
      ...stats,
      lastPlayed: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log('Game stats saved to Firestore:', stats);
    return true;
  } catch (error) {
    console.error('Error saving game stats to Firestore:', error);
    return false;
  }
}

// Function to get game statistics from Firestore
export async function getGameStats() {
  if (!isFirebaseAuthenticated()) {
    console.error('User not authenticated for Firestore operation');
    return {};
  }

  try {
    const userId = getCurrentUserId();
    const statsDocRef = doc(db, 'gameStats', userId);
    const statsDoc = await getDoc(statsDocRef);

    return statsDoc.exists() ? statsDoc.data() : {};
  } catch (error) {
    console.error('Error getting game stats from Firestore:', error);
    return {};
  }
}

// Function to save user profile data
export async function saveUserProfile(profileData) {
  if (!isFirebaseAuthenticated()) {
    console.error('User not authenticated for Firestore operation');
    return false;
  }

  try {
    const userId = getCurrentUserId();
    const userDocRef = doc(db, 'users', userId);

    await setDoc(userDocRef, {
      ...profileData,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log('User profile saved to Firestore:', profileData);
    return true;
  } catch (error) {
    console.error('Error saving user profile to Firestore:', error);
    return false;
  }
}

// Function to get user profile data
export async function getUserProfile() {
  if (!isFirebaseAuthenticated()) {
    console.error('User not authenticated for Firestore operation');
    return {};
  }

  try {
    const userId = getCurrentUserId();
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    return userDoc.exists() ? userDoc.data() : {};
  } catch (error) {
    console.error('Error getting user profile from Firestore:', error);
    return {};
  }
}

// Function to securely hash sensitive data before storing
export async function secureHash(data) {
  // Convert the data to a JSON string
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);

  // Encode the string as UTF-8
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(jsonString);

  // Create a SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

  // Convert the hash to a hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

// Function to validate data integrity using checksum
export async function validateDataIntegrity(originalData, checksum) {
  const calculatedChecksum = await secureHash(originalData);
  return calculatedChecksum === checksum;
}

// Update the temporary security rule expiration date to a longer period
// This is a comment about the security rule - the actual rule is in the firestore.rules file
// The rule currently expires in 24 hours; this should be updated to a longer period for production use

// Function to get global leaderboard
export async function getLeaderboard(limitCount = 10) {
  if (!isFirebaseAuthenticated() && !db) {
    console.error('Firestore not initialized');
    return [];
  }

  try {
    if (!db) {
      console.warn('DB not ready for leaderboard');
      return [];
    }
    // Using the correct Firestore v9 syntax
    const usersCollection = collection(db, 'users');
    const q = query(
      usersCollection,
      orderBy('highScore', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const leaderboard = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      leaderboard.push({
        userId: doc.id,
        highScore: data.highScore || 0,
        totalGames: data.totalGames || 0,
        lastPlayed: data.lastPlayed
      });
    });

    return leaderboard;
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}