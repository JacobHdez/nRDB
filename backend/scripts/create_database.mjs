import { MongoClient } from 'mongodb'

import { municipalities } from './data.mjs'


const base_url_coord = 'https://geocoding-api.open-meteo.com/v1/search'
const base_url_weather = 'https://archive-api.open-meteo.com/v1/archive'

async function connect_to_mongodb( uri )
{
    let mongo_client
    try {
        mongo_client = new MongoClient( uri )
        console.log(`Connecting to MongoDB ...`)

        await mongo_client.connect()
        console.log('Connected to MongoDB ...')

        return mongo_client
    }
    catch ( error ) {
        console.log('Connection to MongoDB failed:', error)
    }
}

async function fetch_coordinates( municipality )
{
    const url = `${base_url_coord}?name=${municipality}&count=20&format=json&language=es`
    try {
        const response = await fetch( url )
        if ( !response.ok ) {
            throw new Error(`http error: ${response.status}`)
        }
        const data = await response.json()
        for ( const result of data.results ) {
            if ( result.admin1 === 'Guanajuato' ) {
                if ( municipality === 'Santa Catarina' && result.admin2 === 'Xichú' )
                    continue
                return result
            }
        }
    }
    catch ( error ) {
        throw error
    }
}

async function get_coordinates()
{
    const db_uri = process.env.MONGODB_URI
    let mongo_client
    try {
        mongo_client = await connect_to_mongodb( db_uri )
        const db = mongo_client.db( 'weather' )
        const collection = db.collection( 'guanajuato' )

        for ( const municipality of municipalities ) {
            const m_data = await fetch_coordinates( municipality )
            const m_coord = {
                name: m_data.name,
                lat: m_data.latitude,
                lon: m_data.longitude
            }
            const result = await collection.insertOne( m_coord )
            console.log(`A document was inserted with the _id: ${result.insertedId}`)
        }
    }
    finally {
        await mongo_client.close()
    }
}

async function fetch_weather( lat, lon, start_date, end_date )
{
    const url = `${base_url_weather}?latitude=${lat}&longitude=${lon}&start_date=${start_date}&end_date=${end_date}&hourly=temperature_2m,surface_pressure`
    try {
        const response = await fetch( url )
        if ( !response.ok ) {
            throw new Error(`http error: ${response.status}`)
        }
        const data = await response.json()
        return data
    }
    catch ( error ) {
        throw error
    }
}

async function get_weather()
{
    const start_date = '2019-01-01'
    const end_date = '2024-10-12'

    const db_uri = process.env.MONGODB_URI
    let mongo_client
    try {
        mongo_client = await connect_to_mongodb( db_uri )
        const db = mongo_client.db( 'weather' )
        const collection = db.collection( 'guanajuato' )

        const c_gto = await collection.find().toArray()
        var count = 0
        for ( const d_m of c_gto ) {
            console.log( `[${++count}] ${d_m.name} => ${d_m.lat},${d_m.lon}` )
            
            const data = await fetch_weather( d_m.lat, d_m.lon, start_date, end_date )

            const result = await collection.updateOne(
                { name: d_m.name },
                { $set: {
                    hourly_units: data.hourly_units,
                    hourly: data.hourly
                } }
            )

            console.log(`${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`)
        }
    }
    finally {
        await mongo_client.close()
    }
}


console.log('Creating database ...')

await get_coordinates()
await get_weather()

console.log('Database created ...')
