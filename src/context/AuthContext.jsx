import { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

const AuthContext = createContext(null)

function mapAuthError(code) {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid credentials'
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.'
    case 'auth/user-disabled':
      return 'Account disabled'
    case 'auth/popup-closed-by-user':
      return 'Login popup was closed. Please try again.'
    case 'auth/popup-blocked':
      return 'Popup blocked by browser. Allow popups and try again.'
    case 'auth/cancelled-popup-request':
      return 'Login cancelled. Please try again.'
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for login. Contact admin.'
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled. Contact admin.'
    default:
      return 'Login failed. Please try again.'
  }
}

async function buildUserFromToken(firebaseUser) {
  const tokenResult = await firebaseUser.getIdTokenResult(true)
  let role = tokenResult.claims.role || null
  let profile = {}

  if (role !== 'admin') {
    try {
      const snap = await getDoc(doc(db, 'students', firebaseUser.uid))
      if (snap.exists()) {
        profile = snap.data()
        if (!role && profile.role === 'student') {
          role = 'student'
        }
      }
    } catch (err) {
      console.warn('[auth] Failed to read student profile:', err.message)
    }
  }

  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    name: firebaseUser.displayName || profile.name || (role === 'admin' ? 'Administrator' : 'Student'),
    photoURL: firebaseUser.photoURL || profile.photoURL || null,
    role,
    ...profile,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userData = await buildUserFromToken(firebaseUser)
          setUser(userData)
        } else {
          setUser(null)
        }
      } catch (err) {
        console.error('[auth] state error', err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    })
    return () => unsubscribe()
  }, [])

  const loginStudent = async (idOrEmail, password) => {
    try {
      const email = idOrEmail.includes('@')
        ? idOrEmail
        : `${idOrEmail.toLowerCase()}@students.rbtmission.com`
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const userData = await buildUserFromToken(cred.user)
      if (userData.role !== 'student') {
        await signOut(auth)
        return { success: false, message: 'Not a student account' }
      }
      return { success: true, user: userData }
    } catch (err) {
      return { success: false, message: mapAuthError(err.code) }
    }
  }

  const loginAdmin = async (idOrEmail, password) => {
    try {
      const email = idOrEmail.includes('@')
        ? idOrEmail
        : `${idOrEmail.toLowerCase()}@rbtmission.com`
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const userData = await buildUserFromToken(cred.user)
      if (userData.role !== 'admin') {
        await signOut(auth)
        return { success: false, message: 'Not an admin account' }
      }
      return { success: true, user: userData }
    } catch (err) {
      return { success: false, message: mapAuthError(err.code) }
    }
  }

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const cred = await signInWithPopup(auth, provider)

      // Create student doc if new user
      try {
        const studentRef = doc(db, 'students', cred.user.uid)
        const snap = await getDoc(studentRef)
        if (!snap.exists()) {
          await setDoc(studentRef, {
            name: cred.user.displayName || 'Student',
            email: cred.user.email,
            photoURL: cred.user.photoURL || null,
            role: 'student',
            status: 'active',
            studentId: 'G-' + cred.user.uid.substring(0, 6).toUpperCase(),
            createdAt: new Date().toISOString()
          })
        } else {
          const data = snap.data()
          if (data.name !== cred.user.displayName || data.photoURL !== cred.user.photoURL) {
            await updateDoc(studentRef, {
              name: cred.user.displayName || data.name,
              photoURL: cred.user.photoURL || data.photoURL || null,
            })
          }
        }
      } catch (firestoreErr) {
        console.warn('[auth] Student doc create failed:', firestoreErr.message)
        // Continue login anyway — user can still access student dashboard
      }

      const userData = await buildUserFromToken(cred.user)
      // Google users always get student role
      if (!userData.role) {
        userData.role = 'student'
      }
      return { success: true, user: userData }
    } catch (err) {
      console.error('[auth] Google login error:', err.code, err.message)
      return { success: false, message: mapAuthError(err.code || 'Login failed') }
    }
  }

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email)
      return { success: true }
    } catch (err) {
      return { success: false, message: mapAuthError(err.code) }
    }
  }

  const logout = async () => {
    await signOut(auth)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, loginStudent, loginAdmin, loginWithGoogle, resetPassword, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
