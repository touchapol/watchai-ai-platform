import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || '';

const globalForMongo = globalThis as unknown as {
    mongoClient: MongoClient | undefined;
    mongoDb: Db | undefined;
    mongoPromise: Promise<Db> | undefined;
};

export async function connectToMongoDB(): Promise<Db> {
    if (globalForMongo.mongoDb) {
        return globalForMongo.mongoDb;
    }

    if (globalForMongo.mongoPromise) {
        return globalForMongo.mongoPromise;
    }

    globalForMongo.mongoPromise = (async () => {
        try {
            const client = new MongoClient(uri, {
                maxPoolSize: 5,
                minPoolSize: 1,
            });
            await client.connect();
            globalForMongo.mongoClient = client;
            globalForMongo.mongoDb = client.db('watchai');

            return globalForMongo.mongoDb;
        } catch (error) {
            globalForMongo.mongoPromise = undefined;
            console.error('MongoDB connection error:', error);
            throw error;
        }
    })();

    return globalForMongo.mongoPromise;
}

export async function getMongoDb(): Promise<Db> {
    return await connectToMongoDB();
}

export async function closeMongoDB(): Promise<void> {
    if (globalForMongo.mongoClient) {
        await globalForMongo.mongoClient.close();
        globalForMongo.mongoClient = undefined;
        globalForMongo.mongoDb = undefined;
        globalForMongo.mongoPromise = undefined;
        console.log('MongoDB connection closed');
    }
}
