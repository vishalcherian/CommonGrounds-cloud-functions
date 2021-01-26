import * as functions from 'firebase-functions'
import express from 'express'

const app = express()

import { validateNewUser, validateLogin } from './middleware/validation'
import { FBAuth } from './middleware/auth'
import { getAllScreams, createScream } from './handlers/screams'
import { signup, login } from './handlers/users'

app.get( '/screams', FBAuth, getAllScreams )

app.post( '/scream', FBAuth, createScream )

app.post( '/signup', validateNewUser, signup )

app.post( '/login', validateLogin, login )

exports.api = functions.https.onRequest( app )
