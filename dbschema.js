let db = {
    screams : [
        {
            userHandle: 'user',
            body: 'this is the scream body',
            createdAt: '<Timestamp>',
            likeCount: 5,
            commentCount: 2
        }
    ],
    notifications : [
        {
            recipien : 'user',
            sender : 'vishal',
            read : 'true | false',
            screamId : 'L0ng5tR1nG0fCh@rs',
            type : 'cheer | comment',
            createdAt : '<Timestamp>'
        }
    ]
}

const userDetails = {
    // Redux data
    credentials  :{
        userId : 'L0ng5tR1nG0fCh@rs',
        email : 'user@email.com',
        handle : 'user',
        createdAt : 'Timestamp',
        imageUrl : 'image url',
        location : 'Baltimore, MD'
    },
    cheers : [
        {
            userHandle : 'user1',
            postId : 'L0ng5tR1nG0fCh@rs'
        },
        // ...
    ],
    comments : [
        {
            handle : 'user',
            postId : 'L0ng5tR1nG0fCh@rs',
            body : 'ha, nice!',
            createdAt : 'Timestamp'
        }
    ]
}