import dotenv from 'dotenv'
dotenv.config()

import * as functions from 'firebase-functions'
import express from 'express'
import { validateNewUser, validateLogin, validateComment } from './middleware/validation'
import { FBAuth } from './middleware/auth'

import {
  getAllScreams,
  createScream,
  getScream,
  newComment,
  addCheer,
  removeCheer,
  getCheersCount
} from './handlers/screams'

import {
  signup,
  login,
  uploadUserImage,
  addUserDetails,
  getAuthUser
} from './handlers/users'

const app = express()

// Scream Routes
app.get( '/screams', FBAuth, getAllScreams )
app.post( '/scream', FBAuth, createScream )
app.get( '/scream/:screamId', FBAuth, getScream )
app.post( '/scream/:screamId/comment', FBAuth, validateComment, newComment )
app.post( '/scream/:screamId/addCheer', FBAuth, addCheer )
app.post( '/scream/:screamId/removeCheer/:cheerId', FBAuth, removeCheer )
app.get( '/scream/:screamId/cheers/count', FBAuth, getCheersCount )

// Signup / Login Routes
app.post( '/signup', validateNewUser, signup )
app.post( '/login', validateLogin, login )
app.post( '/user/image', FBAuth, uploadUserImage )
app.post( '/user', FBAuth, addUserDetails )
app.get( '/user', FBAuth, getAuthUser )

exports.api = functions.https.onRequest( app )
