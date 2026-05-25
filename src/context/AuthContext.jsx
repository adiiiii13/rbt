import { createContext, useContext, useState, useEffect, useRef } from 'react'
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore'
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
    case 'auth/email-already-in-use':
      return 'Email already in use'
    default:
      return 'Login failed'
  }
}

async function buildUserFromToken(firebaseUser) {
  const tokenResult = await firebaseUser.getIdTokenResult(true)
  let role = tokenResult.claims.role || null
  let profile = {}

  // Infer admin role from email domain if claim is missing
  if (!role && firebaseUser.email && firebaseUser.email.toLowerCase().endsWith('@rbtmission.com')) {
    role = 'admin'
  }

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
    // Existing students (batch: undefined) will default to true, new basic users will explicitly have batch: false
    batch: profile.batch !== false,
    ...profile,
    role,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const isAuthActionInProgress = useRef(false)

  useEffect(() => {
    let docUnsub = null;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (isAuthActionInProgress.current) return;
        if (firebaseUser) {
          const userData = await buildUserFromToken(firebaseUser)
          if (isAuthActionInProgress.current) return;
          setUser(userData)

          if (userData.role !== 'admin') {
            docUnsub = onSnapshot(doc(db, 'students', firebaseUser.uid), (docSnap) => {
              if (!docSnap.exists() && !isAuthActionInProgress.current) {
                signOut(auth);
                setUser(null);
              } else if (docSnap.exists() && !isAuthActionInProgress.current) {
                const data = docSnap.data();
                if (data.forceLogout) {
                  updateDoc(doc(db, 'students', firebaseUser.uid), { forceLogout: false }).then(() => {
                    signOut(auth);
                    setUser(null);
                  });
                } else {
                  setUser(prev => prev ? { ...prev, ...data } : prev);
                }
              }
            });
          }
        } else {
          setUser(null)
          if (docUnsub) docUnsub()
        }
      } catch (err) {
        console.error('[auth] state error', err)
        setUser(null)
      } finally {
        if (!isAuthActionInProgress.current) {
          setLoading(false)
        }
      }
    })
    return () => {
      unsubscribe();
      if (docUnsub) docUnsub();
    }
  }, [])

  const loginStudent = async (idOrEmail, password, isBatch = false, batchCode = '') => {
    isAuthActionInProgress.current = true;
    try {
      const email = idOrEmail.includes('@')
        ? idOrEmail
        : `${idOrEmail.toLowerCase()}@students.rbtmission.com`
      const cred = await signInWithEmailAndPassword(auth, email, password)

      if (isBatch) {
        const snap = await getDoc(doc(db, 'students', cred.user.uid));
        const data = snap.exists() ? snap.data() : null;
        if (data && data.batchStatus === 'approved') {
          if (!batchCode || data.assignedBatchCode !== batchCode) {
            await signOut(auth);
            return { success: false, message: 'Invalid Batch Code. Access Denied.' };
          }
        }
      }

      const userData = await buildUserFromToken(cred.user)
      if (userData.role !== 'student') {
        await signOut(auth)
        return { success: false, message: 'Not a student account' }
      }

      const updates = {};
      // Migrate old-format studentId for email logins
      if (!userData.studentId || !userData.studentId.match(/^RBT\d{2}[GEB]-/)) {
        const newStudentId = 'RBT26E-' + cred.user.uid.substring(0, 6).toUpperCase();
        updates.studentId = newStudentId;
        userData.studentId = newStudentId;
      }

      // Upgrade to batch if requested
      if (isBatch && (!userData.batchStatus || userData.batchStatus === 'none') && !userData.batch) {
        setUser(userData);
        return { success: false, requireUpgrade: true, user: userData };
      }

      if (Object.keys(updates).length > 0) {
        const studentRef = doc(db, 'students', cred.user.uid);
        await updateDoc(studentRef, updates);
      }

      setUser(userData)
      return { success: true, user: userData }
    } catch (err) {
      return { success: false, message: mapAuthError(err.code) }
    } finally {
      isAuthActionInProgress.current = false;
      setLoading(false);
    }
  }

  const loginAdmin = async (idOrEmail, password) => {
    isAuthActionInProgress.current = true;
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
      setUser(userData)
      return { success: true, user: userData }
    } catch (err) {
      return { success: false, message: mapAuthError(err.code) }
    } finally {
      isAuthActionInProgress.current = false;
      setLoading(false);
    }
  }

  const loginWithGoogle = async (isBatch = false, batchCode = '') => {
    isAuthActionInProgress.current = true;
    try {
      const provider = new GoogleAuthProvider()
      const cred = await signInWithPopup(auth, provider)
      
      const studentRef = doc(db, 'students', cred.user.uid)
      const snap = await getDoc(studentRef)
      const data = snap.exists() ? snap.data() : null;

      if (isBatch && data && data.batchStatus === 'approved') {
        if (!batchCode || data.assignedBatchCode !== batchCode) {
          await signOut(auth);
          return { success: false, message: 'Invalid Batch Code. Access Denied.' };
        }
      }

      if (!snap.exists()) {
        await setDoc(studentRef, {
          name: cred.user.displayName || 'Student',
          email: cred.user.email,
          photoURL: cred.user.photoURL || null,
          role: 'student',
          batch: false,
          batchStatus: isBatch ? 'pending' : 'none',
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
        if (!data.studentId || !data.studentId.match(/^RBT\d{2}[GEB]-/)) {
          updates.studentId = 'RBT26G-' + cred.user.uid.substring(0, 6).toUpperCase();
        }
        
        // Upgrade to batch if requested
        if (isBatch && (!data.batchStatus || data.batchStatus === 'none') && !data.batch) {
          // We will handle upgrade later, don't update here
        } else if (Object.keys(updates).length > 0) {
          await updateDoc(studentRef, updates);
        }
      }
      
      const userData = await buildUserFromToken(cred.user)
      if (userData.role !== 'student') {
        await signOut(auth)
        return { success: false, message: 'Not a student account' }
      }
      
      if (isBatch && (!userData.batchStatus || userData.batchStatus === 'none') && !userData.batch) {
        setUser(userData);
        return { success: false, requireUpgrade: true, user: userData };
      }

      setUser(userData)
      return { success: true, user: userData }
    } catch (err) {
      console.error(err);
      return { success: false, message: mapAuthError(err.code || 'Login failed') }
    } finally {
      isAuthActionInProgress.current = false;
      setLoading(false);
    }
  }

  const signupStudent = async (email, password, name, isBatch = false) => {
    isAuthActionInProgress.current = true;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      
      const studentRef = doc(db, 'students', cred.user.uid)
      await setDoc(studentRef, {
        name: name || 'Student',
        email: cred.user.email,
        photoURL: null,
        role: 'student',
        batch: false,
        batchStatus: isBatch ? 'pending' : 'none',
        status: 'active',
        studentId: 'RBT26E-' + cred.user.uid.substring(0, 6).toUpperCase(),
        createdAt: new Date().toISOString()
      })
      
      const userData = await buildUserFromToken(cred.user)
      setUser(userData)
      return { success: true, user: userData }
    } catch (err) {
      console.error(err);
      return { success: false, message: mapAuthError(err.code || 'Signup failed'), code: err.code }
    } finally {
      isAuthActionInProgress.current = false;
      setLoading(false);
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

  const upgradeToBatch = async () => {
    if (!user) return { success: false, message: 'No user logged in' };
    isAuthActionInProgress.current = true;
    try {
      const studentRef = doc(db, 'students', user.uid);
      await updateDoc(studentRef, { batchStatus: 'pending' });
      setUser(prev => ({ ...prev, batchStatus: 'pending' }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      isAuthActionInProgress.current = false;
    }
  };

  const logout = async () => {
    isAuthActionInProgress.current = true;
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      isAuthActionInProgress.current = false;
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, loginStudent, loginAdmin, loginWithGoogle, signupStudent, resetPassword, logout, upgradeToBatch }}
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
