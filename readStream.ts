import {
    KinesisClient,
    GetRecordsCommand,
    GetRecordsCommandOutput,
    GetShardIteratorCommand,
    GetShardIteratorCommandOutput,
    _Record as Record,
} from "@aws-sdk/client-kinesis";

// Define KinesisMessage interface
interface KinesisMessage {
    PartitionKey: string;
    SequenceNumber: string;
    Data: string;
}

// Fixed AWS region
const REGION = "eu-west-1"; // Hardcoded region

// Initialize Kinesis client with a fixed region
const kinesisClient = new KinesisClient({ region: REGION });

/**
 * Fetches messages from a Kinesis stream.
 */
async function readMessagesFromStream(streamName: string, shardId: string, maxMessages: number) {
    try {
        // Step 1: Get the Shard Iterator
        const shardIteratorCommand: GetShardIteratorCommand = new GetShardIteratorCommand({
            StreamName: streamName,
            ShardId: shardId,
            ShardIteratorType: "TRIM_HORIZON", // You can change this to LATEST or AT_TIMESTAMP
        });
        const shardIteratorResponse: GetShardIteratorCommandOutput = await kinesisClient.send(shardIteratorCommand);
        let shardIterator: string | undefined = shardIteratorResponse.ShardIterator;

        if (!shardIterator) {
            throw new Error("Failed to get shard iterator.");
        }

        let messages: KinesisMessage[] = [];
        let fetchedMessages = 0;

        // Step 2: Get Records from the Stream
        while (shardIterator && fetchedMessages < maxMessages) {
            const getRecordsCommand = new GetRecordsCommand({
                ShardIterator: shardIterator,
                Limit: Math.min(maxMessages - fetchedMessages, 100), // Kinesis limits max records to 100 at a time
            });
            const recordsResponse: GetRecordsCommandOutput = await kinesisClient.send(getRecordsCommand);
            console.log(`Fetched ${recordsResponse.Records?.length} records`);

            const records: Record[] = recordsResponse.Records || [];
            records.forEach((record: Record) => {
                messages.push({
                    PartitionKey: record.PartitionKey!,
                    SequenceNumber: record.SequenceNumber!,
                    Data: Buffer.from(record.Data as Uint8Array).toString("utf-8"), // assuming Data is a string
                });
            });

            fetchedMessages += records.length;

            // Move to the next shard iterator
            shardIterator = recordsResponse.NextShardIterator;
        }

        // Step 3: Show the messages
        console.log(`Fetched ${messages.length} messages:`);
        messages.forEach((msg, index) => {
            console.log(`${msg.Data}`);
        });
    } catch (error) {
        console.error("Error reading messages from Kinesis:", error);
    }
}

// Get command-line arguments
const streamName = process.argv[2];
const shardId = process.argv[3] || "shardId-000000000000"; // Default shard ID
const maxMessages = parseInt(process.argv[4], 10) || 100; // Default to 100 messages

if (!streamName) {
    console.error("Usage: npm run start -- <streamName> [shardId] [maxMessages]");
    process.exit(1);
}

// Call the function to read messages from the stream
readMessagesFromStream(streamName, shardId, maxMessages);
