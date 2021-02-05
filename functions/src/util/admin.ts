import fbadmin from 'firebase-admin'

const serviceAccount : any = process.env.PERSONAL_GOOGLE_APPLICATION_CREDENTIALS
const databaseURL : any = process.env.FIREBASE_DATABASE_URL

fbadmin.initializeApp( {
  credential : fbadmin.credential.cert( serviceAccount ),
  databaseURL
} )

export const db = fbadmin.firestore()
export const admin = fbadmin

