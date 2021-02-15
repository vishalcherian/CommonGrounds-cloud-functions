import { db, admin } from './admin'
import constants from './constants'

// eslint-disable-next-line max-len
export const incrementCounter = async ( counterType : any, docId : any, numShards : any, updateNumber : number = 1 ) => {
  const shardId = Math.floor( Math.random() * numShards )
  const shardRef = db.collection( `${counterType}Shards` ).doc( `${docId}-${shardId.toString()}` )
  return shardRef
    .set( { count : admin.firestore.FieldValue.increment( updateNumber ) }, { merge : true } )
}

// eslint-disable-next-line max-len
export const decrementCounter = async ( counterType : any, docId : any, numShards : any, updateNumber : number = -1 ) => {
  const startingShardId = Math.floor( Math.random() * numShards )
  let shardRef = db.collection( `${counterType}Shards` ).doc( `${docId}-${startingShardId.toString()}` )
  let validShardFound = false

  for ( let i = startingShardId; i < startingShardId + numShards; i++ ) {
    const currShardId = i % numShards
    shardRef = db.collection( `${counterType}Shards` ).doc( `${docId}-${currShardId.toString()}` )
    const currShard = await shardRef.get()

    if ( !currShard.exists ) continue
    const shardData = currShard.data()
    if ( shardData?.count > 0 ) {
      validShardFound = true
      break
    }
  }

  return shardRef
    .set( { count : admin.firestore.FieldValue.increment( validShardFound ? updateNumber : 0 ) }, { merge : true } )
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
