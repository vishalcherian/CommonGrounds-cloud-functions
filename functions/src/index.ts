import dotenv from 'dotenv'
dotenv.config()

import * as functions from 'firebase-functions'
import express from 'express'
import { validateNewUser, validateLogin, validateComment } from './middleware/validation'
import { FBAuth } from './middleware/auth'

import {
  getAllScreams,
  createScream,
  removeScream,
  getScream,
  newComment,
  removeComment,
  addCheer,
  removeCheer,
  getCheersCount
} from './handlers/screams'
import {
  signup,
  login,
  uploadUserImage,
  addUserDetails,
  getAuthUser,
  getUserDetails,
  markNotificationsRead
} from './handlers/users'
import { db } from './util/admin'

const app = express()

// Scream Routes
app.get( '/screams', FBAuth, getAllScreams )
app.post( '/scream', FBAuth, createScream )
app.get( '/scream/:screamId', FBAuth, getScream )
app.delete( '/scream/:screamId', FBAuth, removeScream )
app.post( '/scream/:postId/comment', FBAuth, validateComment, newComment )
app.delete( '/scream/:postId/comment/:commentId', FBAuth, removeComment )
app.post( '/scream/:screamId/addCheer', FBAuth, addCheer )
app.post( '/scream/:screamId/removeCheer', FBAuth, removeCheer )
app.get( '/scream/:screamId/cheers/count', FBAuth, getCheersCount )

// Signup / Login Routes
app.post( '/signup', validateNewUser, signup )
app.post( '/login', validateLogin, login )
app.post( '/user/image', FBAuth, uploadUserImage )
app.post( '/user', FBAuth, addUserDetails )
app.get( '/user', FBAuth, getAuthUser )
app.get( '/user/:handle', getUserDetails )
app.post( '/user/notifications', FBAuth, markNotificationsRead )

exports.api = functions.https.onRequest( app )

exports.createNotificationOnCheer = functions.region( 'us-central1' ).firestore.document( 'cheers/{id}' )
  .onCreate( async snapshot => {
    try {
      const screamDoc = await db.doc( `/screams/${snapshot.data().postId}` ).get()
      if ( screamDoc.exists && snapshot.data().userHandle !== screamDoc.data()?.userHandle ) {
        return db.doc( `/notifications/${snapshot.id}` ).set( {
          createdAt : new Date().toISOString(),
          recipient : screamDoc.data()?.userHandle,
          sender : snapshot.data().userHandle,
          type : 'cheer',
          read : false,
          postId : screamDoc.id
        } )
      }
      return
    } catch ( err ) {
      console.error( err )
      return
    }
  } )

exports.deleteNotificationOnRemoveCheer = functions.region( 'us-central1' ).firestore.document( 'cheers/{id}' )
  .onDelete( async snapshot => {
    try {
      await db.doc( `/notifications/${snapshot.id}` ).delete()
    } catch ( err ) {
      console.error( err )
    }
  } )

exports.createNotificationOnComment = functions.region( 'us-central1' ).firestore.document( 'comments/{id}' )
  .onCreate( async snapshot => {
    try {
      const screamDoc = await db.doc( `/screams/${snapshot.data().postId}` ).get()
      if ( screamDoc.exists && snapshot.data().userHandle !== screamDoc.data()?.userHandle ) {
        return db.doc( `/notifications/${snapshot.id}` ).set( {
          createdAt : new Date().toISOString(),
          recipient : screamDoc.data()?.userHandle,
          sender : snapshot.data().userHandle,
          type : 'comment',
          read : false,
          postId : screamDoc.id
        } )
      }
      return
    } catch ( err ) {
      console.error( err )
      return
    }
  } )

exports.deleteNotificationOnDeleteComment = functions.region( 'us-central1' ).firestore.document( 'comments/{id}' )
  .onDelete( async snapshot => {
    try {
      await db.doc( `/notifications/${snapshot.id}` ).delete()
    } catch ( err ) {
      console.error( err )
    }
  } )

exports.onUserImageChange = functions.region( 'us-central1' ).firestore.document( 'users/{id}' )
  .onUpdate( async change => {
    try {
      const before = change.before.data()
      const after = change.after.data()
      if ( before.imageUrl !== after.imageUrl ) {
        const batch = db.batch()
        const screams = await db.collection( 'screams' )
          .where( 'userHandle', '==', after.userHandle )
          .get()
        screams.forEach( doc => {
          const scream = db.doc( `/screams/${doc.id}` )
          batch.update( scream, { userImage : after.imageUrl } )
        } )
        return batch.commit()
      }
      return
    } catch ( err ) {
      console.error( err )
      return
    }
  } )

exports.onScreamDelete = functions.region( 'us-central1' ).firestore.document( 'screams/{id}' )
  .onDelete( async snapshot => {
    try {
      // delete all relevant comments
      const batch = db.batch()
      const comments = await db.collection( 'comments' )
        .where( 'postId', '==', snapshot.id )
        .get()
      comments.forEach( comment => {
        batch.delete( db.doc( `comments/${comment.id}` ) )
      } )
      const cheers = await db.collection( 'cheers' )
        .where( 'postId', '==', snapshot.id )
        .get()
      cheers.forEach( cheer => {
        batch.delete( db.doc( `cheers/${cheer.id}` ) )
      } )

      batch.commit()
      // delete all relevant likes
    } catch ( err ) {
      console.error( err )
      return
    }
  } )
