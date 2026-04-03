/**
 * firebase-app.js — Firebase integration for SVG Font Maker
 * Provides authentication (Google login) and Firestore (cloud save)
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged }
  from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, getDocs, deleteDoc, collection }
  from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyCg9Rahia4mNZVLz_NdUwyh_beQWqn0Tlc",
  authDomain: "svg-font-maker.firebaseapp.com",
  projectId: "svg-font-maker",
  storageBucket: "svg-font-maker.firebasestorage.app",
  messagingSenderId: "476005614983",
  appId: "1:476005614983:web:25a3a0b88292ad5d70bf22"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ─── Auth Functions ───

async function signIn() {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error('Sign-in failed:', e);
    throw e;
  }
}

async function signOutUser() {
  try {
    await fbSignOut(auth);
  } catch (e) {
    console.error('Sign-out failed:', e);
    throw e;
  }
}

function onAuthChange(callback) {
  onAuthStateChanged(auth, callback);
}

function getCurrentUser() {
  return auth.currentUser;
}

// ─── Firestore Functions ───

async function saveProject(userId, projectId, data) {
  const ref = doc(db, 'users', userId, 'projects', projectId);
  await setDoc(ref, data, { merge: true });
}

async function loadProject(userId, projectId) {
  const ref = doc(db, 'users', userId, 'projects', projectId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

async function listProjects(userId) {
  const colRef = collection(db, 'users', userId, 'projects');
  const snap = await getDocs(colRef);
  const projects = [];
  snap.forEach(d => {
    projects.push({ id: d.id, ...d.data() });
  });
  return projects;
}

async function deleteProject(userId, projectId) {
  const ref = doc(db, 'users', userId, 'projects', projectId);
  await deleteDoc(ref);
}

// ─── Export ───

window.FirebaseApp = {
  signIn,
  signOut: signOutUser,
  onAuthChange,
  getCurrentUser,
  saveProject,
  loadProject,
  listProjects,
  deleteProject,
};
