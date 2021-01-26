import { db } from '../util/admin'
import firebase from 'firebase'
import config from '../util/config'

firebase.initializeApp( config.firebase )

export const signup = async ( req : any, res : any ) => {
  const newUser = {
    email : req.body.email,
    password : req.body.password,
    confirmPassword : req.body.confirmPassword,
    userHandle : req.body.userHandle
  }

  let userId : string = ''
  let token : any = ''

  try {
    const doc = await db.doc(`/users/${newUser.userHandle}`).get()
    if ( doc.exists ) {
      return res.status( 400 ).json( { handle : 'This handle is already taken' } )
    } else {
      const data = await firebase.auth().createUserWithEmailAndPassword( newUser.email, newUser.password )
      userId = data.user?.uid!
      token = await data.user?.getIdToken()
      const userCredentials = {
        userHandle : newUser.userHandle,
        email : newUser.email,
        createdAt : new Date().toISOString(),
        userId
      }
      await db.doc( `/users/${newUser.userHandle}` ).set( userCredentials )
      return res.status( 201 ).json( { token } )
    }
  } catch ( err ) {
    console.error( err )
    if ( err.code === 'auth/email-already-in-use' ) {
      return res.status( 400 ).json( { email : 'Email is already in use' } )
    }
    return res.status( 500 ).json( { error : err.code } )
  }
}

export const login = async ( req : any, res : any ) => {
  const user = {
    email : req.body?.email,
    password : req.body?.password
  }

  try {
    const data = await firebase.auth().signInWithEmailAndPassword( user.email, user.password )
    const token = await data.user?.getIdToken()
    return res.status( 200 ).json( { token } )
  } catch ( err ) {
    console.error( err )
    if ( err.code === 'auth/wrong-password' ) {
      return res.status( 403 ).json( { error : 'Wrong username/password. Please try again' } )
    }
    return res.status( 500 ).json( { error : err.code } )
  }
}
