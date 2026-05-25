import {
  collection, getDocs, getDoc, doc, addDoc, updateDoc,
  deleteDoc, query, orderBy, where, serverTimestamp
} from 'firebase/firestore'
import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from 'firebase/storage'
import { db, storage } from './firebase'

// ─── Firestore CRUD ───

export async function getCollection(collectionName, orderField = 'createdAt') {
  try {
    const q = query(collection(db, collectionName), orderBy(orderField, 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    // If ordering fails (no index), fall back to unordered
    const snapshot = await getDocs(collection(db, collectionName))
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
  }
}

export async function getDocById(collectionName, id) {
  const docRef = doc(db, collectionName, id)
  const docSnap = await getDoc(docRef)
  if (!docSnap.exists()) return null
  return { id: docSnap.id, ...docSnap.data() }
}

export async function addDocument(collectionName, data) {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateDocument(collectionName, id, data) {
  const docRef = doc(db, collectionName, id)
  await updateDoc(docRef, data)
}

export async function deleteDocument(collectionName, id) {
  await deleteDoc(doc(db, collectionName, id))
}

export async function getCollectionWhere(collectionName, field, op, value) {
  try {
    const q = query(collection(db, collectionName), where(field, op, value))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error(`[getCollectionWhere] failed for ${collectionName}:`, err)
    throw err
  }
}

// ─── Storage ───

export async function uploadFile(path, file) {
  const storageRef = ref(storage, path)
  const snapshot = await uploadBytes(storageRef, file)
  const downloadURL = await getDownloadURL(snapshot.ref)
  return downloadURL
}

export async function deleteFile(path) {
  const storageRef = ref(storage, path)
  await deleteObject(storageRef)
}

// ─── Seed data (run once to populate Firestore) ───

export async function seedCollection(collectionName, dataArray) {
  const existing = await getDocs(collection(db, collectionName))
  if (!existing.empty) return false // already seeded
  for (const item of dataArray) {
    await addDoc(collection(db, collectionName), {
      ...item,
      createdAt: serverTimestamp(),
    })
  }
  return true
}
