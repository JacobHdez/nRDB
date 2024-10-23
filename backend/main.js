import http from 'http'
import { URL } from 'url'

const hostname = '127.0.0.1'
const port = 3000

const server = http.createServer( async ( request, response ) => {
    const request_url = new URL( request.url, `http://${request.headers.host}` )

    response.setHeader( 'Access-Control-Allow-Origin', '*' )
    response.setHeader( 'Access-Control-Allow-Methods', 'GET' )
    response.setHeader( 'Access-Control-Allow-Headers', 'Content-Type' )

    if ( request_url.pathname === '/' && request.method === 'GET' ) {
        const municipality = request_url.searchParams.get( 'municipality' )

        if ( !municipality ) {
            response.writeHead( 400, { 'Content-Type': 'application/json' } )
            response.end( JSON.stringify( { error: 'Municipality is required' } ) )
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
