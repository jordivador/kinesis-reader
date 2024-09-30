# kinesis-reader
Script to read & show kinesis messages

## Init
- Your AWS credentials should be already available in `~/.aws/credentias`
- Region is hardcoded so if you're working out of `eu-west-1` you will need to update the `readStream.ts` file `REGION` var.
- Once repo cloned run `npm install` ( tested with node 18 )


## Run pars
Example: `npm run start -- <streamName> [shardId] [maxMessages]`

__streamName__ *[required]*

__ShardId__ *[optional]* default `shardId-000000000000`

__maxMessages__ *[optional]* default `100` 
