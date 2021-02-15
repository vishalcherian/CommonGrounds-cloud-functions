import { db, admin } from '../util/admin'
import Constants from '../util/constants'
import { getCount, incrementCounter, decrementCounter } from '../util/common'

interface Scream {
  userHandle : string,
  userImage : string,
  title : string;
  description : string;
  createdOn : firebase.default.firestore.Timestamp,
  likeCount : Number,
  commentCount : Number
}

interface Cheer {
  userHandle : string,
  postId : string
}

export const getAllScreams = ( req : any, res : any ) => {
  db.collection( 'screams' )
    .get()
    .then( data => {
      const screams : any = []
      data.forEach( doc => {
        screams.push( { id : doc.id, ...doc.data() } )
      } )
      return res.json( screams )
    } )
    .catch( err => {
      res.status( 404 ).json( { error : 'Could not find data' } )
      console.log( err )
    } )
}

export const createScream = ( req : any, res : any ) => {
  const newScream : Scream = {
    userHandle : req.user.handle,
    userImage : req.user.imageUrl,
    title : req.body.title || '',
    description : req.body.description || '',
    // createdOn : fb.default.firestore.Timestamp.fromDate( new Date() ),
    createdOn : admin.firestore.Timestamp.fromDate( new Date() ),
    likeCount : 0,
    commentCount : 0
  }

  db.collection( 'screams' )
    .add( newScream )
    .then( doc => {
      res.json( { screamId : doc.id, ...newScream } )
    } )
    .catch( err => {
      console.error( err )
      res.status( 500 ).json( { error : 'Something went wrong' } )
    } )
}

export const getScream = async ( req : any, res : any ) => {
  let screamData : any = null
  try {
    console.log( 'in getScream' )
    const { screamId } = req.params
    const screamDoc = await db.doc( `/screams/${screamId}`).get()
    if ( !screamDoc.exists ) {
      return res.status( 400 ).json( { message : 'could not find scream' } )
    }
    screamData = screamDoc.data()
    screamData.screamId = screamId
    screamData.userHandle = req.user.handle
    screamData.comments = []
    const commentsCollection = await db.collection( 'comments' )
      .orderBy( 'createdAt', 'desc' )
      .where( 'screamId', '==', screamId )
      .get()
    commentsCollection.forEach( comment => screamData.comments.push( comment.data() ) )
    return res.status( 200 ).json( { scream : screamData } )
  } catch ( err ) {
    console.error( err )
    return res.status( 500 ).json( { error : err.code } )
  }
}

export const newComment = async ( req : any, res : any ) => {
  const comment : any = {
    screamId : req.params.screamId,
    body : req.body.body,
    userHandle : req.user.handle,
    createdAt : admin.firestore.Timestamp.fromDate( new Date() ),
    userImage : req.user.imageUrl
  }
  try {
    const scream = await db.doc( `screams/${req.params.screamId}` ).get()
    if ( !scream.exists ) {
      return res.json( 404 ).json( { error : 'scream does not exist' } )
    }
    const commentRef = await db.collection( 'comments' ).add( comment )
    return res.status( 200 ).json( { message : `comment ${commentRef.id} posted` } )
  } catch ( err ) {
    console.error( err )
    res.status( 500 ).json( { error : err.code } )
  }
}

export const addCheer = async ( req : any, res : any ) => {
  const { screamId } = req.params
  try {
    const screamDoc = await db.doc( `screams/${screamId}` ).get()
    if ( !screamDoc.exists ) {
      return res.json( 404 ).json( { error : 'scream does not exist' } )
    }
    await incrementCounter( 'cheers', screamDoc.id, Constants.CHEERS_SHARD_COUNT, 1 )

    const cheer : Cheer = {
      userHandle : req.user.handle,
      postId : screamId
    }

    const cheerDoc = await db.collection( 'cheers' ).add( cheer )
    return res.status( 200 ).json( { message : 'successfully cheered a post!', cheerId : cheerDoc.id } )
  } catch ( err ) {
    console.error( err )
    return req.status( 500 ).json( { error : err.code } )
  }
}

export const removeCheer = async ( req : any, res : any ) => {
  const { screamId, cheerId } = req.params
  try {
    const screamDoc = await db.doc( `screams/${screamId}` ).get()
    if ( !screamDoc.exists ) {
      return res.json( 404 ).json( { error : 'scream does not exist' } )
    }
    await db.doc( `cheers/${cheerId}` ).delete( { exists : true } )
    await decrementCounter( 'cheers', screamDoc.id, Constants.CHEERS_SHARD_COUNT, -1 )
    return res.status( 200 ).json( { message : 'successfully removed a cheer from a post!' } )
  } catch ( err ) {
    console.error( err )
    return req.status( 500 ).json( { error : err.code } )
  }
}

export const getCheersCount = async ( req : any, res : any ) => {
  const { screamId } = req.params
  try {
    const count = await getCount( 'cheers', screamId )
    return res.status( 200 ).json( { count } )
  } catch ( err ) {
    console.error( err )
    return res.status( 500 ).json( { error : err.code } )
  }
}
