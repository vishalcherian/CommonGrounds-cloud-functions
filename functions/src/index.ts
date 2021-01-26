import * as functions from 'firebase-functions'
import express from 'express'

const app = express()

import { validateNewUser, validateLogin } from './middleware/validation'
import { FBAuth } from './middleware/auth'
import { getAllScreams, createScream } from './handlers/screams'
import { signup, login, uploadUserImage } from './handlers/users'

// Scream Routes
app.get( '/screams', FBAuth, getAllScreams )
app.post( '/scream', FBAuth, createScream )

// Signup / Login Routes
app.post( '/signup', validateNewUser, signup )
app.post( '/login', validateLogin, login )
app.post( '/user/image', FBAuth, uploadUserImage )

exports.api = functions.https.onRequest( app )
