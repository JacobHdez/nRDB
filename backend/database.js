import { MongoClient } from 'mongodb'

export async function connect_to_mongo( uri )
{
    let mongo_client
    try {
        mongo_client = new MongoClient( uri )
        console.log('Connecting to MongoDB ...')

        await mongo_client.connect()
        console.log('Connected to MongoDB ...')

        return mongo_client
    }
    catch ( error ) {
        console.error( 'Connection to MongoDB failed:', error )
    }
}
