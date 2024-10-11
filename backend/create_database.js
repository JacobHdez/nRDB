import { municipalities } from "./data.js"

const base_url_coordinates = 'http://api.openweathermap.org/geo/1.0/direct'

const fetch_coordinates = async (municipality) => {
    const url = `${base_url_coordinates}?q=${municipality},Guanajuato,MX&appid=${process.env.OPENWEATHER_API_KEY}`
    try {
        const response = await fetch(url)
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

const coordinates = []
for ( const municipality of municipalities ) {
    const data = (await fetch_coordinates(municipality))[0]
    const coord = {
        name: data.name,
        lat: data.lat,
        lon: data.lon
    }
    coordinates.push(coord)
}
console.log(coordinates)
