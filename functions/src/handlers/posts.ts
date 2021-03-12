import { db, admin } from '../util/admin'
import Constants from '../util/constants'
import { getCount, incrementCounter, decrementCounter } from '../util/common'
import { firestore } from 'firebase-admin'

interface Post {
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

export const getAllPosts = ( req : any, res : any ) => {
  db.collection( 'posts' )
    .get()
    .then( data => {
      const posts : any = []
      data.forEach( doc => {
        posts.push( { id : doc.id, ...doc.data() } )
      } )
      return res.json( posts )
    } )
    .catch( err => {
      res.status( 404 ).json( { error : 'Could not find data' } )
      console.log( err )
    } )
}

export const createPost = ( req : any, res : any ) => {
  const newPost : Post = {
    userHandle : req.user.handle,
    userImage : req.user.imageUrl,
    title : req.body.title || '',
    description : req.body.description || '',
    // createdOn : fb.default.firestore.Timestamp.fromDate( new Date() ),
    createdOn : admin.firestore.Timestamp.fromDate( new Date() ),
    likeCount : 0,
    commentCount : 0
  }

  db.collection( 'posts' )
    .add( newPost )
    .then( doc => {
      res.json( { postId : doc.id, ...newPost } )
    } )
    .catch( err => {
      console.error( err )
      res.status( 500 ).json( { error : 'Something went wrong' } )
    } )
}

export const removePost = async ( req : any, res : any ) => {
  const { postId } = req.params
  try {
    const post = await db.doc( `posts/${postId}` )
    const postDoc = await post.get()
    if ( !postDoc.exists ) {
      return res.status( 404 ).json( { error : 'post does not exist' } )
    }
    if ( postDoc.data()?.userHandle !== req.user.handle ) {
      return res.status( 403 ).json( { error : 'user is not authorized to delete this post' } )
    }
    await post.delete()
    return res.status( 200 ).json( { message : 'post successfully deleted' } )
  } catch ( err ) {
    console.error( err )
    res.status( 500 ).json( { error : err.code } )
  }
}

export const getPost = async ( req : any, res : any ) => {
  let postData : any = null
  try {
    console.log( 'in getPost' )
    const { postId } = req.params
    const postDoc = await db.doc( `/posts/${postId}`).get()
    if ( !postDoc.exists ) {
      return res.status( 400 ).json( { message : 'could not find post' } )
    }
    postData = postDoc.data()
    postData.postId = postId
    postData.userHandle = req.user.handle
    postData.comments = []
    const commentsCollection = await db.collection( 'comments' )
      .orderBy( 'createdAt', 'desc' )
      .where( 'postId', '==', postId )
      .get()
    commentsCollection.forEach( comment => postData.comments.push( comment.data() ) )
    return res.status( 200 ).json( { post : postData } )
  } catch ( err ) {
    console.error( err )
    return res.status( 500 ).json( { error : err.code } )
  }
}

export const newComment = async ( req : any, res : any ) => {
  const comment : any = {
    postId : req.params.postId,
    body : req.body.body,
    userHandle : req.user.handle,
    createdAt : admin.firestore.Timestamp.fromDate( new Date() ),
    userImage : req.user.imageUrl
  }
  try {
    const post = await db.doc( `posts/${req.params.postId}` ).get()
    if ( !post.exists ) {
      return res.json( 404 ).json( { error : 'post does not exist' } )
    }
    const commentRef = await db.collection( 'comments' ).add( comment )
    await db.doc( `posts/${req.params.postId}` ).update( { commentCount : firestore.FieldValue.increment( 1 ) } )
    return res.status( 200 ).json( { message : `comment ${commentRef.id} posted` } )
  } catch ( err ) {
    console.error( err )
    res.status( 500 ).json( { error : err.code } )
  }
}

export const removeComment = async ( req : any, res : any ) => {
  try {
    const { postId, commentId } = req.params
    const postDoc = await db.doc( `posts/${postId}` ).get()
    if ( !postDoc.exists ) {
      return res.json( 404 ).json( { error : 'post does not exist' } )
    }
    const commentDoc = await db.doc( `comments/${commentId}` ).get()
    if ( !commentDoc.exists ) {
      return res.json( 404 ).json( { error : 'comment does not exist' } )
    }
    await db.doc( `comments/${commentId}` ).delete()
    await db.doc( `posts/${postId}` ).update( { commentCount : firestore.FieldValue.increment( -1 ) } )
    return res.status( 200 ).json( { message : `comment ${commentId} successfully deleted` } )
  } catch ( err ) {
    console.error( err )
    res.status( 500 ).json( { error : err.code } )
  }
}

export const addCheer = async ( req : any, res : any ) => {
  const { postId } = req.params
  try {
    const postDoc = await db.doc( `posts/${postId}` ).get()
    if ( !postDoc.exists ) {
      return res.json( 404 ).json( { error : 'post does not exist' } )
    }

    const cheerCheckDoc = await db.collection( 'cheers' )
      .where( 'postId', '==', postDoc.id )
      .where( 'userHandle', '==', req.user.handle )
      .get()

    if ( !cheerCheckDoc.empty ) {
      return res.status( 409 ).json( { error : 'post already cheered' } )
    }

    await incrementCounter( 'cheers', postDoc.id, Constants.CHEERS_SHARD_COUNT, 1 )

    const cheer : Cheer = {
      userHandle : req.user.handle,
      postId : postId
    }

    const cheerDoc = await db.collection( 'cheers' ).add( cheer )
    return res.status( 200 ).json( { message : 'successfully cheered a post!', cheerId : cheerDoc.id } )
  } catch ( err ) {
    console.error( err )
    return req.status( 500 ).json( { error : err.code } )
  }
}

export const removeCheer = async ( req : any, res : any ) => {
  const { postId } = req.params
  try {
    const postDoc = await db.doc( `posts/${postId}` ).get()
    if ( !postDoc.exists ) {
      return res.json( 404 ).json( { error : 'post does not exist' } )
    }
    const cheers = await db.collection( 'cheers' )
      .where( 'postId', '==', postId )
      .where( 'userHandle', '==', req.user.handle )
      .get()

    cheers.forEach( cheer => {
      cheer.ref.delete()
    } )

    await decrementCounter( 'cheers', postDoc.id, Constants.CHEERS_SHARD_COUNT, -1 )
    return res.status( 200 ).json( { message : 'successfully removed a cheer from a post!' } )
  } catch ( err ) {
    console.error( err )
    return req.status( 500 ).json( { error : err.code } )
  }
}

export const getCheersCount = async ( req : any, res : any ) => {
  const { postId } = req.params
  try {
    const count = await getCount( 'cheers', postId )
    return res.status( 200 ).json( { count } )
  } catch ( err ) {
    console.error( err )
    return res.status( 500 ).json( { error : err.code } )
  }
}
