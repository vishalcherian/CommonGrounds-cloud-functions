import { body, validationResult } from 'express-validator'

export const validateNewUser = [
  body( 'email' ).isEmail(),
  body( 'password' ).isLength( { min : 5 } ),
  ( req : any, res : any, next : any ) => {
    if ( req.body?.password !== req.body?.confirmPassword ) {
      return res.status(422).json( { error : 'Passwords do not match' } )
    }
    return next()
  },
  ( req : any, res : any, next : any ) => {
    const errors : any = validationResult( req )
    if ( !errors.isEmpty() ) {
      return res.status(422).json( { errors : errors.array() } )
    }
    return next()
  }
]

export const validateLogin = [
  body( 'email' ).isEmail(),
  body( 'password' ).isLength( { min : 5 } ),
  ( req : any, res : any, next : any ) => {
    const errors : any = validationResult( req )
    if ( !errors.isEmpty() ) {
      return res.status( 422 ).json( { errors : errors.array() } )
    }
    return next()
  }
]

export const validateComment = [
  body( 'body' ).trim().not().isEmpty(),
  ( req : any, res : any, next : any ) => {
    const errors : any = validationResult( req )
    if ( !errors.isEmpty() ) {
      return res.status( 422 ).json( { errors : errors.array() } )
    }
    return next()
  }
]
