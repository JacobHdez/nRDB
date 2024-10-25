import http from 'http'
import { URL } from 'url'
import { MongoClient } from 'mongodb'

const hostname = process.env.HOSTNAME || '127.0.0.1'
const port = process.env.PORT || 3000

async function connect_to_mongo( uri )
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

const server = http.createServer( async ( request, response ) => {
    const request_url = new URL( request.url, `http://${request.headers.host}` )

    response.setHeader( 'Access-Control-Allow-Origin', '*' )
    response.setHeader( 'Access-Control-Allow-Methods', 'GET' )
    response.setHeader( 'Access-Control-Allow-Headers', 'Content-Type' )

    if ( request_url.pathname === '/' && request.method === 'GET' ) {
        const municipality = request_url.searchParams.get( 'municipality' )
        const start_date = request_url.searchParams.get( 'start_date' )
        const end_date = request_url.searchParams.get( 'end_date' )

        if ( !municipality ) {
            response.writeHead( 400, { 'Content-Type': 'application/json' } )
            response.end( JSON.stringify( { error: 'municipality is required' } ) )
            return
        }
        else if ( !start_date ) {
            response.writeHead( 400, { 'Content-Type': 'application/json' } )
            response.end( JSON.stringify( { error: 'start_date is required' } ) )
            return
        }
        else if ( !end_date ) {
            response.writeHead( 400, { 'Content-Type': 'application/json' } )
            response.end( JSON.stringify( { error: 'end_date is required' } ) )
            return
        }

        const db_uri = process.env.MONGODB_URI
        let mongo_client
        try {
            mongo_client = await connect_to_mongo( db_uri )
            const db = mongo_client.db( 'weather' )
            const collection = db.collection( 'guanajuato' )

            const municipality_data = await collection.findOne( { name: municipality } )
            if ( !municipality_data ) {
                response.writeHead( 404, { 'Content-Type': 'application/json' } )
                response.end( JSON.stringify( { error: 'Municipality not found' } ) )
                return
            }

            const startDate = new Date( start_date )
            const endDate = new Date( end_date )

            const filtered_data = {
                ...municipality_data,
                hourly: {
                    time: [],
                    temperature_2m: [],
                    surface_pressure: []
                }
            }

            for ( let i = 0; i < municipality_data.hourly.time.length; ++i ) {
                const timestamp = new Date( municipality_data.hourly.time[i] )

                if ( timestamp >= startDate && timestamp <= endDate ) {
                    filtered_data.hourly.time.push( municipality_data.hourly.time[i] )
                    filtered_data.hourly.temperature_2m.push( municipality_data.hourly.temperature_2m[i] )
                    filtered_data.hourly.surface_pressure.push( municipality_data.hourly.surface_pressure[i] )
                }
            }
            
            response.writeHead( 200, { 'Content-Type': 'application/json' } )
            response.end( JSON.stringify( { data: filtered_data } ) )
        }
        finally {
            await mongo_client.close()
        }
    }
    else {
        response.writeHead( 404, { 'Content-Type': 'application/json' } )
        response.end( JSON.stringify( { error: 'Route not found' } ) )
    }
} )
server.listen( port, hostname, () => {
    console.log( `Server is running on http://${hostname}:${port}` )
} )
