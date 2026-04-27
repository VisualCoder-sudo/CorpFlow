/**
 * CorpFlow API Layer — api.js
 * ─────────────────────────────────────────────────────────────────
 * Central abstraction over Firebase Firestore + Auth.
 * All pages import from here — never call Firebase directly in UI code.
 *
 * HOW TO ADD A NEW DATA MODEL:
 *   1. Create a new section below (e.g. "── TICKETS ──")
 *   2. Export CRUD functions using the helpers at the bottom
 *   3. Import those functions in your new page JS
 *
 * HOW TO ADD A THIRD-PARTY API:
 *   1. Add an entry to EXTERNAL_APIS below
 *   2. Create an async function that calls it (see exampleExternalFetch)
 * ─────────────────────────────────────────────────────────────────
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, sendPasswordResetEmail,
  updateProfile, GoogleAuthProvider, signInWithPopup, GithubAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, addDoc,
  setDoc, updateDoc, deleteDoc, query, where, orderBy,
  limit, serverTimestamp, onSnapshot, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Firebase config ──────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyAJ-ijFfP4SKoFtn29jhM2vUGA5CYJjq00",
  authDomain:        "corpflowdb-44f5b.firebaseapp.com",
  projectId:         "corpflowdb-44f5b",
  storageBucket:     "corpflowdb-44f5b.firebasestorage.app",
  messagingSenderId: "456144403684",
  appId:             "1:456144403684:web:5c729f88ef74b7bb1380f1",
  measurementId:     "G-28C03PCEC4"
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// ── External API registry ────────────────────────────────────────
// Add new 3rd-party APIs here. Each entry describes how to reach it.
export const EXTERNAL_APIS = {
  // example: openai: { base: "https://api.openai.com/v1", key: "sk-..." },
  // example: stripe:  { base: "https://api.stripe.com/v1", key: "sk_..." },
};

// ── Internal DB helpers ──────────────────────────────────────────
// Use these helpers to build new collection APIs.

/** Get a user-scoped collection path */
const userCol = (uid, colName) => collection(db, "users", uid, colName);

/** Get all docs from a collection */
export async function getAllDocs(uid, colName) {
  const snap = await getDocs(userCol(uid, colName));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Get one doc by id */
export async function getOneDoc(uid, colName, docId) {
  const snap = await getDoc(doc(db, "users", uid, colName, docId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Add a new doc (auto-id) */
export async function addOne(uid, colName, data) {
  const ref = await addDoc(userCol(uid, colName), {
    ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  });
  return ref.id;
}

/** Set a doc by id (creates or overwrites) */
export async function setOne(uid, colName, docId, data) {
  await setDoc(doc(db, "users", uid, colName, docId), {
    ...data, updatedAt: serverTimestamp()
  }, { merge: true });
}

/** Update specific fields */
export async function updateOne(uid, colName, docId, fields) {
  await updateDoc(doc(db, "users", uid, colName, docId), {
    ...fields, updatedAt: serverTimestamp()
  });
}

/** Delete a doc */
export async function deleteOne(uid, colName, docId) {
  await deleteDoc(doc(db, "users", uid, colName, docId));
}

/** Query with filters — filters: [{ field, op, value }] */
export async function queryDocs(uid, colName, filters = [], sortBy = null) {
  let q = userCol(uid, colName);
  const constraints = filters.map(f => where(f.field, f.op, f.value));
  if (sortBy) constraints.push(orderBy(sortBy.field, sortBy.dir || 'asc'));
  q = query(q, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Live listener — calls cb(docs) whenever data changes */
export function listenDocs(uid, colName, cb) {
  const unsub = onSnapshot(userCol(uid, colName), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
  return unsub; // call unsub() to stop listening
}

// ── Auth helpers ─────────────────────────────────────────────────
export async function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function register(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  // Bootstrap user doc
  await setDoc(doc(db, "users", cred.user.uid), {
    email, displayName, createdAt: serverTimestamp(), plan: "free"
  }, { merge: true });
  return cred;
}

export async function logout() {
  return signOut(auth);
}

export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

export function onAuth(cb) {
  return onAuthStateChanged(auth, cb);
}

export function requireAuth(redirectTo = "auth.html") {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, user => {
      unsub();
      if (!user) { window.location.href = redirectTo; return; }
      resolve(user);
    });
  });
}

// ── USER PROFILE ─────────────────────────────────────────────────
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateUserProfile(uid, fields) {
  await setDoc(doc(db, "users", uid), { ...fields, updatedAt: serverTimestamp() }, { merge: true });
}

// ── CLIENTS ──────────────────────────────────────────────────────
export const getClients    = (uid)          => getAllDocs(uid, "clients");
export const getClient     = (uid, id)      => getOneDoc(uid, "clients", id);
export const addClient     = (uid, data)    => addOne(uid, "clients", data);
export const updateClient  = (uid, id, d)  => updateOne(uid, "clients", id, d);
export const deleteClient  = (uid, id)     => deleteOne(uid, "clients", id);
export const listenClients = (uid, cb)     => listenDocs(uid, "clients", cb);

// ── PROJECTS ─────────────────────────────────────────────────────
export const getProjects    = (uid)         => getAllDocs(uid, "projects");
export const getProject     = (uid, id)     => getOneDoc(uid, "projects", id);
export const addProject     = (uid, data)   => addOne(uid, "projects", data);
export const updateProject  = (uid, id, d) => updateOne(uid, "projects", id, d);
export const deleteProject  = (uid, id)    => deleteOne(uid, "projects", id);
export const listenProjects = (uid, cb)    => listenDocs(uid, "projects", cb);

// ── TASKS ────────────────────────────────────────────────────────
export const getTasks    = (uid)         => getAllDocs(uid, "tasks");
export const getTask     = (uid, id)     => getOneDoc(uid, "tasks", id);
export const addTask     = (uid, data)   => addOne(uid, "tasks", data);
export const updateTask  = (uid, id, d) => updateOne(uid, "tasks", id, d);
export const deleteTask  = (uid, id)    => deleteOne(uid, "tasks", id);
export const listenTasks = (uid, cb)    => listenDocs(uid, "tasks", cb);

// ── INVOICES ─────────────────────────────────────────────────────
export const getInvoices   = (uid)         => getAllDocs(uid, "invoices");
export const getInvoice    = (uid, id)     => getOneDoc(uid, "invoices", id);
export const addInvoice    = (uid, data)   => addOne(uid, "invoices", data);
export const updateInvoice = (uid, id, d) => updateOne(uid, "invoices", id, d);
export const deleteInvoice = (uid, id)    => deleteOne(uid, "invoices", id);

// ── EMPLOYEES ────────────────────────────────────────────────────
export const getEmployees   = (uid)         => getAllDocs(uid, "employees");
export const addEmployee    = (uid, data)   => addOne(uid, "employees", data);
export const updateEmployee = (uid, id, d) => updateOne(uid, "employees", id, d);
export const deleteEmployee = (uid, id)    => deleteOne(uid, "employees", id);

// ── EXPENSES ─────────────────────────────────────────────────────
export const getExpenses   = (uid)         => getAllDocs(uid, "expenses");
export const addExpense    = (uid, data)   => addOne(uid, "expenses", data);
export const updateExpense = (uid, id, d) => updateOne(uid, "expenses", id, d);
export const deleteExpense = (uid, id)    => deleteOne(uid, "expenses", id);

// ── INVENTORY ────────────────────────────────────────────────────
export const getInventory   = (uid)         => getAllDocs(uid, "inventory");
export const addInventory    = (uid, data)   => addOne(uid, "inventory", data);
export const updateInventory = (uid, id, d) => updateOne(uid, "inventory", id, d);
export const deleteInventory = (uid, id)    => deleteOne(uid, "inventory", id);

// ── ANALYTICS helper ─────────────────────────────────────────────
export async function getDashboardStats(uid) {
  const [clients, projects, tasks, invoices, expenses] = await Promise.all([
    getClients(uid), getProjects(uid), getTasks(uid),
    getInvoices(uid), getExpenses(uid)
  ]);

  const totalRevenue = invoices
    .filter(i => i.status === "paid")
    .reduce((s, i) => s + (i.amount || 0), 0);

  const totalExpenses = expenses
    .reduce((s, e) => s + (e.amount || 0), 0);

  const openTasks = tasks.filter(t => t.status !== "done").length;
  const activeProjects = projects.filter(p => p.status === "active").length;

  return { totalRevenue, totalExpenses, openTasks, activeProjects,
           clientCount: clients.length, projectCount: projects.length };
}

// ── EXAMPLE: adding a 3rd-party API call ─────────────────────────
// export async function exampleExternalFetch(endpoint, params = {}) {
//   const api = EXTERNAL_APIS.openai;
//   const res = await fetch(`${api.base}/${endpoint}`, {
//     headers: { Authorization: `Bearer ${api.key}`, "Content-Type": "application/json" },
//     method: "POST", body: JSON.stringify(params)
//   });
//   return res.json();
// }

// ── Timestamp utilities ──────────────────────────────────────────
export function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  
  // Optional: Check if user exists in DB, otherwise bootstrap them
  const profile = await getUserProfile(user.uid);
  if (!profile) {
    await setDoc(doc(db, "users", user.uid), {
      email: user.email, 
      displayName: user.displayName, 
      createdAt: serverTimestamp(), 
      plan: "free"
    }, { merge: true });
  }
  return result;
}

export async function loginWithGitHub() {
  const result = await signInWithPopup(auth, githubProvider);
  const user = result.user;
  
  // Bootstrap user doc if it doesn't exist
  const profile = await getUserProfile(user.uid);
  if (!profile) {
    await setDoc(doc(db, "users", user.uid), {
      email: user.email, 
      displayName: user.displayName, 
      createdAt: serverTimestamp(), 
      plan: "free"
    }, { merge: true });
  }
  return result;
}

export function nowTimestamp() { return serverTimestamp(); }
