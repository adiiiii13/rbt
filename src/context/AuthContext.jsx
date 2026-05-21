import { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword
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
      return 'Network error'
    case 'auth/user-disabled':
      return 'Account disabled'
    default:
      return 'Login failed'
  }
}

async function buildUserFromToken(firebaseUser) {
  const tokenResult = await firebaseUser.getIdTokenResult(true)
  let role = tokenResult.claims.role || null
  let profile = {}

  // Always check student profile if role is not admin
  if (role !== 'admin') {
    const snap = await getDoc(doc(db, 'students', firebaseUser.uid))
    if (snap.exists()) {
      profile = snap.data()
      if (!role) {
        role = profile.role || 'student' // Infer role from document if claim is missing
      }
    }
  }

  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    name: firebaseUser.displayName || profile.name || (role === 'admin' ? 'Administrator' : 'Student'),
    photoURL: firebaseUser.photoURL || profile.photoURL || null,
    ...profile,
    role,
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

      // Migrate old-format studentId for email logins
      if (userData.studentId && !userData.studentId.match(/^RBT\d{2}[GEB]-/)) {
        const studentRef = doc(db, 'students', cred.user.uid);
        const newStudentId = 'RBT26E-' + cred.user.uid.substring(0, 6).toUpperCase();
        await updateDoc(studentRef, { studentId: newStudentId });
        userData.studentId = newStudentId;
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
      
      const studentRef = doc(db, 'students', cred.user.uid)
      const snap = await getDoc(studentRef)
      if (!snap.exists()) {
        await setDoc(studentRef, {
          name: cred.user.displayName || 'Student',
          email: cred.user.email,
          photoURL: cred.user.photoURL || null,
          role: 'student',
          status: 'active',
          studentId: 'RBT26G-' + cred.user.uid.substring(0, 6).toUpperCase(),
          createdAt: new Date().toISOString()
        })
      } else {
        // Sync the latest Google profile data if they already have an account
        const data = snap.data();
        const updates = {};
        if (data.name !== cred.user.displayName) updates.name = cred.user.displayName || data.name;
        if (data.photoURL !== cred.user.photoURL) updates.photoURL = cred.user.photoURL || data.photoURL || null;
        // Migrate old-format studentId (missing G/E/B letter) to new format
        if (data.studentId && !data.studentId.match(/^RBT\d{2}[GEB]-/)) {
          updates.studentId = 'RBT26G-' + cred.user.uid.substring(0, 6).toUpperCase();
        }
        if (Object.keys(updates).length > 0) await updateDoc(studentRef, updates);
      }
      
      const userData = await buildUserFromToken(cred.user)
      if (userData.role !== 'student') {
        await signOut(auth)
        return { success: false, message: 'Not a student account' }
      }
      return { success: true, user: userData }
    } catch (err) {
      console.error(err);
      return { success: false, message: mapAuthError(err.code || 'Login failed') }
    }
  }

  const signupStudent = async (email, password, name) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      
      const studentRef = doc(db, 'students', cred.user.uid)
      await setDoc(studentRef, {
        name: name || 'Student',
        email: cred.user.email,
        photoURL: null,
        role: 'student',
        status: 'active',
        studentId: 'RBT26E-' + cred.user.uid.substring(0, 6).toUpperCase(),
        createdAt: new Date().toISOString()
      })
      
      const userData = await buildUserFromToken(cred.user)
      return { success: true, user: userData }
    } catch (err) {
      console.error(err);
      return { success: false, message: mapAuthError(err.code || 'Signup failed') }
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

  const loginWithBatchCode = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const cred = await signInWithPopup(auth, provider)

      const studentRef = doc(db, 'students', cred.user.uid)
      const snap = await getDoc(studentRef)
      if (!snap.exists()) {
        await setDoc(studentRef, {
          name: cred.user.displayName || 'Student',
          email: cred.user.email,
          photoURL: cred.user.photoURL || null,
          role: 'student',
          batch: true,
          status: 'active',
          studentId: 'RBT26B-' + cred.user.uid.substring(0, 6).toUpperCase(),
          createdAt: new Date().toISOString()
        })
      } else {
        const data = snap.data();
        const updates = {
          name: cred.user.displayName || data.name,
          photoURL: cred.user.photoURL || data.photoURL || null,
          batch: true,
        };
        // Migrate old-format studentId (missing G/E/B letter) to new format
        if (data.studentId && !data.studentId.match(/^RBT\d{2}[GEB]-/)) {
          updates.studentId = 'RBT26B-' + cred.user.uid.substring(0, 6).toUpperCase();
        }
        await updateDoc(studentRef, updates);
      }

      const userData = await buildUserFromToken(cred.user)
      userData.batch = true
      return { success: true, user: userData }
    } catch (err) {
      return { success: false, message: mapAuthError(err.code || 'Login failed') }
    }
  }

  const logout = async () => {
    await signOut(auth)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, loginStudent, loginAdmin, loginWithGoogle, loginWithBatchCode, signupStudent, resetPassword, logout }}
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
