import dotenv from 'dotenv'
import cors from 'cors'

dotenv.config()

import * as functions from 'firebase-functions'
import express from 'express'
import { validateNewUser, validateLogin, validateComment } from './middleware/validation'
import { FBAuth } from './middleware/auth'

import {
  getAllPosts,
  createPost,
  removePost,
  getPost,
  newComment,
  removeComment,
  addCheer,
  removeCheer,
  getCheersCount
} from './handlers/posts'
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

app.use( cors( { origin : true } ) )

// Post Routes
app.get( '/posts', FBAuth, getAllPosts )
app.post( '/post', FBAuth, createPost )
app.get( '/post/:postId', FBAuth, getPost )
app.delete( '/post/:postId', FBAuth, removePost )
app.post( '/post/:postId/comment', FBAuth, validateComment, newComment )
app.delete( '/post/:postId/comment/:commentId', FBAuth, removeComment )
app.post( '/post/:postId/addCheer', FBAuth, addCheer )
app.post( '/post/:postId/removeCheer', FBAuth, removeCheer )
app.get( '/post/:postId/cheers/count', FBAuth, getCheersCount )

// Signup & Login Routes
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
      const postDoc = await db.doc( `/posts/${snapshot.data().postId}` ).get()
      if ( postDoc.exists && snapshot.data().userHandle !== postDoc.data()?.userHandle ) {
        return db.doc( `/notifications/${snapshot.id}` ).set( {
          createdAt : new Date().toISOString(),
          recipient : postDoc.data()?.userHandle,
          sender : snapshot.data().userHandle,
          type : 'cheer',
          read : false,
          postId : postDoc.id
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
      const postDoc = await db.doc( `/posts/${snapshot.data().postId}` ).get()
      if ( postDoc.exists && snapshot.data().userHandle !== postDoc.data()?.userHandle ) {
        return db.doc( `/notifications/${snapshot.id}` ).set( {
          createdAt : new Date().toISOString(),
          recipient : postDoc.data()?.userHandle,
          sender : snapshot.data().userHandle,
          type : 'comment',
          read : false,
          postId : postDoc.id
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
        const posts = await db.collection( 'posts' )
          .where( 'userHandle', '==', after.userHandle )
          .get()
        posts.forEach( doc => {
          const post = db.doc( `/posts/${doc.id}` )
          batch.update( post, { userImage : after.imageUrl } )
        } )
        return batch.commit()
      }
      return
    } catch ( err ) {
      console.error( err )
      return
    }
  } )

exports.onPostDelete = functions.region( 'us-central1' ).firestore.document( 'posts/{id}' )
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
