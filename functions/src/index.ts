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
      if ( screamDoc.exists ) {
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
      if ( screamDoc.exists ) {
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
