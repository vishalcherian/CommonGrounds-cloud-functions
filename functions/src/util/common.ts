import { db, admin } from './admin'
import constants from './constants'

export const updateCounter = ( counterType : any, docId : any, numShards : any, updateNumber : number ) => {
  
  const shardId = Math.floor( Math.random() * numShards )
  const shardRef = db.collection( `${counterType}Shards` ).doc( `${docId}-${shardId.toString()}` )
  return shardRef
    .set( { count : admin.firestore.FieldValue. }, { merge : true } )
}

export const getCount = async ( counterType : any, docId : any ) => {
  const shardsIds = []
  for ( let i = 1; i <= constants.CHEERS_SHARD_COUNT; i++ ) {
    shardsIds.push( `${docId}-${i}` )
  }
  console.log( shardsIds )

  const documents = await db.collection( `${counterType}Shards` )
    .where( admin.firestore.FieldPath.documentId(), 'in', shardsIds )
    .get()
  let count = 0
  documents.forEach( doc => {
    count += doc.get( 'count' )
  } )

  return count
}
