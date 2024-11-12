import { MongoClient } from 'mongodb'
import redis from 'redis'

const redis_client = redis.createClient({
    password: process.env.REDIS_ROOT_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
    }
})

export async function connect_to_mongo( uri )
{
    let mongo_client
    try {
        mongo_client = new MongoClient( uri )
        console.log('Connecting to MongoDB ...')

        await mongo_client.connect()
        console.log('Connected to MongoDB ...')
    }
    catch ( error ) {
        console.error( 'Connection to MongoDB failed:', error )
        mongo_client = undefined
    }
    finally {
        return mongo_client
    }
}

async function get_cache( key )
{
    let data = undefined
    try {
        console.log( 'Connecting to Redis ...' )
        await redis_client.connect()
        console.log( 'Connected to Redis' )

        data = await redis_client.get( key )
        console.log( 'Key matched' )

        console.log( 'Disconnecting to Redis ...' )
        await redis_client.disconnect()
        console.log( 'Disconnected to Redis' )
    }
    catch ( error ) {
        console.error( 'Redis client error:', error )
    }

    return data
}

async function set_cache( key, data )
{
    try {
        console.log( 'Connecting to Redis ...' )
        await redis_client.connect()
        console.log( 'Connected to Redis' )

        await redis_client.set( key, data )
        console.log( 'Key set' )

        console.log( 'Disconnecting to Redis ...' )
        await redis_client.disconnect()
        console.log( 'Disconnected to Redis' )
    }
    catch ( error ) {
        console.error( 'Redis client error:', error )
    }
}

async function get_db( key )
{
    const db_uri = process.env.MONGODB_URI
    let mongo_client = await connect_to_mongo( db_uri )
    if ( !mongo_client ) return undefined

    const db = mongo_client.db( 'weather' )
    const collection = db.collection( 'guanajuato' )
    const municipality_data = await collection.findOne( { name: key } )

    await mongo_client.close()
    return municipality_data
}

export async function get_municipality_data( municipality )
{
    let data
    data = await get_cache( municipality )

    if ( data ) return JSON.parse( data )

    data = await get_db( municipality )
    if ( !data ) return undefined

    await set_cache( municipality, JSON.stringify( data ) )

    return data
}
