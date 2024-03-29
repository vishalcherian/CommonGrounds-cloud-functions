import BusBoy from 'busboy'
import path from 'path'
import os from 'os'
import fs from 'fs'

import { admin, db } from '../util/admin'
import firebase from 'firebase'
import config from '../util/config'


firebase.initializeApp( config.firebase )

// interface Notification {
//   recipient : string,
//   sender : string,
//   createdAt : Date,
//   postId : string,
//   type : string,
//   read : boolean,
//   notificationId : string
// }

interface OwnUserData {
  credentials : any
  cheers : any[]
  notifications : any[]
}

interface OtherUserData {
  user : any,
  posts : any
}

export const signup = async ( req : any, res : any ) => {
  const newUser = {
    firstName : req.body.firstName,
    lastName : req.body.lastName,
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
      const imageUrl = `https://identicon-api.herokuapp.com/${newUser.userHandle}/80?format=(svg)` // jdenticon library
      const userCredentials = {
        userHandle : newUser.userHandle,
        email : newUser.email,
        createdAt : new Date().toISOString(),
        userId,
        imageUrl
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

export const getAuthUser = async ( req : any, res : any ) => {
  const userData : OwnUserData = { credentials : '', cheers : [], notifications : [] }
  try {
    const userDoc = await db.doc( `/users/${req.user.handle}` ).get()
    if ( !userDoc.exists ) {
      return res.status( 500 ).json( { message : 'no such user' } )
    }
    userData.credentials = userDoc.data()
    const userCheers = await db.collection( 'cheers' ).where( 'userHandle', '==', req.user.handle ).get()
    userCheers.forEach( cheer => {
      userData.cheers.push( cheer.data() )
    } )
    // return res.json( userData )
    const userNotifications = await db.collection( 'notifications' )
      .where( 'userHandle', '==', req.user.handle )
      .orderBy( 'createdAt', 'desc' )
      .get()

    userNotifications.forEach( notif => {
      userData.notifications.push( {
        ...notif.data(),
        notificationId : notif.id
      } )
    } )

    return res.json( userData )
  } catch ( err ) {
    console.error( err )
    res.status( 500 ).json( { message : err.code } )
  }
}

export const addUserDetails = async ( req : any, res : any ) => {
  // TODO
  try {
    await db.doc( `/users/${req.user.handle}` ).update( req.body )
    return res.status( 200 ).json( { message : `${req.user.handle} successfully updated` } )
  } catch ( err ) {
    console.error( err )
    return res.status( 500 ).json( { message : err.code } )
  }
}

export const uploadUserImage = async ( req : any, res : any ) => {
  const busboy = new BusBoy( { headers : req.headers } )
  let imageFileName = ''
  let imageToBeUploaded = {
    imageFilePath : '',
    mimetype : ''
  }

  busboy.on( 'file', ( fieldname : any, file : any, filename : any, encoding : any, mimetype : any ) => {
    if ( mimetype !== 'image/jpeg' && mimetype !== 'image/png' && mimetype !== 'image/svg') {
      return res.status( 400 ).json( { message : 'Wrong filetype given' } )
    }
    const imageExtension = filename.split( '.' )[filename.split( '.' ).length - 1]
    imageFileName = `${Math.round( Math.random()*1000000000 )}.${imageExtension}`
    const imageFilePath = path.join( os.tmpdir(), imageFileName )
    imageToBeUploaded = { imageFilePath, mimetype }
    file.pipe( fs.createWriteStream( imageFilePath ) )
  } )

  busboy.on( 'finish', async () => {
    try {
      await admin.storage().bucket().upload( imageToBeUploaded.imageFilePath, {
        resumable : false,
        metadata : {
          metadata : {
            contentType : imageToBeUploaded.mimetype
          }
        }
      } )

      // eslint-disable-next-line max-len
      const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.firebase.storageBucket}/o/${imageFileName}?alt=media`
      await db.doc(`/users/${req.user.handle}`).update( { imageUrl } )

      return res.status( 201 ).json( { message : 'Image uploaded successfully' } )
    } catch ( err ) {
      console.error( err )
      return res.status( 500 ).json( { error : err.code } )
    }
  })

  busboy.end( req.rawBody )
}

export const getUserDetails = async ( req : any, res : any ) => {
  const userData : OtherUserData = { user : '', posts : [] }
  const { handle } = req.params
  try {
    const userDoc = await db.doc( `users/${handle}` ).get()
    if ( !userDoc.exists ) {
      return res.status( 404 ).json( { error : 'user does not exist' } )
    }
    userData.user = userDoc.data()
    const posts = await db.collection( 'posts' )
      .where( 'userHandle', '==', req.params.handle )
      .orderBy( 'createdAt', 'desc')
      .get()
    posts.forEach( post => {
      userData.posts.push( {
        ...post.data(),
        postId : post.id
      } )
    } )
    return res.status( 200 ).json( userData )
  } catch ( err ) {
    console.error( err )
  }
}

export const markNotificationsRead = async ( req : any, res : any ) => {
  try {
    const batch = db.batch()
    req.body.forEach( ( notifId : any ) => {
      const notification = db.doc( `/notifications/${notifId}` )
      batch.update( notification, { read : true } )
    } )
    await batch.commit()
    return res.status( 200 ).json( { message : 'marked notifications read' } )
  } catch ( err ) {
    console.error( err )
    res.status( 500 ).json( { error : err.code } )
  }
}
