import { admin, db } from '../util/admin'

export const FBAuth = async ( req : any, res : any, next : any ) => {
  let idToken
  if ( req.headers.authorization && req.headers.authorization.startsWith( 'Bearer ' ) ) {
    idToken = req.headers.authorization.split( ' ' )[1]
  } else {
    console.error( 'No token found' )
    return res.status( 403 ).json( { error : 'Unauthorized' } )
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken( idToken )
    req.user = decodedToken
    const data = await db.collection( 'users' ).where( 'userId', '==', req.user.uid ).limit( 1 ).get()
    req.user.handle = data.docs[0].data().userHandle
    req.user.imageUrl = data.docs[0].data().imageUrl || ''
    req.user.userId = data.docs[0].data().userId

    return next()
  } catch ( err ) {
    console.error( 'Error while verifying token:', err )
    if ( err.code === 'auth/argument-error' ) {
      return res.status( 403 ).json( { error : 'Unauthorized' } )
    }
    return res.status( 403 ).json( { error : err.code } )
  }
}
