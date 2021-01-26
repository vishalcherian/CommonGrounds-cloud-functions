import fbadmin from 'firebase-admin'
fbadmin.initializeApp()

export const db = fbadmin.firestore()
export const admin = fbadmin

