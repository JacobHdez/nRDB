import http from 'http'
import { URL } from 'url'
import { get_municipality_data } from './database.js'

const hostname = process.env.HOSTNAME || '127.0.0.1'
const port = process.env.PORT || 3000

const server = http.createServer( async ( request, response ) => {
    const request_url = new URL( request.url, `http://${request.headers.host}` )

    response.setHeader( 'Access-Control-Allow-Origin', '*' )
    response.setHeader( 'Access-Control-Allow-Methods', 'GET' )
    response.setHeader( 'Access-Control-Allow-Headers', 'Content-Type' )

    if ( request_url.pathname === '/' && request.method === 'GET' ) {
        response.writeHead( 200, { 'Content-Type': 'application/json' } )
        response.end( JSON.stringify( { data: 'Hello World!' } ) )
        return
    }

    const municipality = decodeURIComponent( request_url.pathname ).substring(1)
    const data = await get_municipality_data( municipality )
    if ( !data ) {
        response.writeHead( 404, { 'Content-Type': 'application/json' } )
        response.end( JSON.stringify( { error: 'Route not found' } ) )
        return
    }

    var start_date = request_url.searchParams.get( 'start_date' )
    if ( !start_date ) start_date = data.hourly.time.at(0)
    var end_date = request_url.searchParams.get( 'end_date' )
    if ( !end_date ) end_date = data.hourly.time.at(-1)

    const filtered_data = filter_data( data, start_date, end_date )

    response.writeHead( 200, { 'Content-Type': 'application/json' } )
    response.end( JSON.stringify( { data: filtered_data } ) )
} )
server.listen( port, hostname, () => {
    console.log( `Server is running on http://${hostname}:${port}` )
} )

function filter_data( data, start_date, end_date )
{
    const startDate = new Date( start_date )
    const endDate = new Date( end_date )

    const filtered_data = {
        ...data,
        hourly: {
            time: [],
            temperature_2m: [],
            surface_pressure: []
        }
    }

    for ( let i = 0; i < data.hourly.time.length; ++i ) {
        const timestamp = new Date( data.hourly.time[i] )

        if ( timestamp >= startDate && timestamp <= endDate ) {
            filtered_data.hourly.time.push( data.hourly.time[i] )
            filtered_data.hourly.temperature_2m.push( data.hourly.temperature_2m[i] )
            filtered_data.hourly.surface_pressure.push( data.hourly.surface_pressure[i] )
        }
    }

    return filtered_data
}
