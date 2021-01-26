import { db, admin } from '../util/admin'

interface Scream {
  userHandle : string,
  title : string;
  description : string;
  createdOn : firebase.default.firestore.Timestamp,
  likeCount : Number,
  commentCount : Number
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
      res.json( { message : `document ${doc.id} created successfully` } )
    } )
    .catch( err => {
      res.status( 500 ).json( { error : 'Something went wrong' } )
      console.log( err )
    } )
}
