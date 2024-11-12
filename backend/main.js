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

    response.writeHead( 200, { 'Content-Type': 'application/json' } )
    response.end( JSON.stringify( { data: data } ) )
} )
server.listen( port, hostname, () => {
    console.log( `Server is running on http://${hostname}:${port}` )
} )
