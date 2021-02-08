# CommonGrounds - Cloud Functions

## Local Setup

1. `cd functions` and run `npm install`
2. To run locally, run `npm run build` and then `firebase serve`. You can access the routes at `http://localhost:5000/commongrounds-d4f8a/us-central1/api/`
3. To deploy, simply run `firebase deploy`

## Some Todo's

- [ ] fully convert all files to typescript
- [ ] better validation for user signup ( like longer password w/ special characters )
- [ ] ability to login in with either username or email

## Timestamp

### 3:04:24 - What's Next

- liking/unliking a post
- ~~distributed counters for incrementing values at scale~~ decrement without going negative
  - go through shards until you find a non zero one, then decrement that

