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

## Technical Challenges

- Trying to be as efficient as possible when interacting with the database so as to minimize read/writes.
  - I used distributed counters to increment/decrement values at scale. Because firestore can only update a particular field once per second, you have to use these to be able to update at a faster rate. I have chosen 10 shards, which might be kind of overkill since I doubt my application will ever recieve that much traffic, but assuming it might, I think this would be a good number to start. There is a tradeoff however: while more shards does mean more bandwidth to update, it can also be more inefficient when you need to aggregate the counts.
  - Some interesting problems arose, while making this, such as making sure your aggregate count never falls under zero when          decrementing without having access to an accurate aggregate count. The way I went about solving this is the following:
    1. If the aggregate count is 0, then the counts at all shards should also be 0.
    2. Knowing this, I chose a random shard as usual, and if it was 0, I walked through the shards until I found one that wasn't, and decremented that. If all shards had a count of 0, then I did nothing.
    3. Ideally this would be prevented in the first place through enforcement in the frontend ( as you can't unlike a post you haven't liked, so it will always be zero-sum )
  - One challenge I continue to face is how to keep an updated aggregate count.
    - The naive solution would be to update at every like or dislike. That would slow down the application by the number of shards I have for the distributed counters ( 10 in my case ).
    - Operating under the assumption that the user doesn't care that much about the exact number of likes at every given moment, especially as a post gets more likes. Some accuracy can be given up for efficiency. Something I might try doing is running some kind of sweep at an interval to update the aggregated count. This could be based on a time, or based on a function of updates ( ie. update every 6 updates ). The tradeoff: More frequent sweeps means more reads/writes, but a higher accuracy, whereas less frequent sweeps means less reads/writes, but lower accuracy.