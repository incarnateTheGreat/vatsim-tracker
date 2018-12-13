import axios from 'axios'
import { SERVER_PATH } from '../constants/constants'

export const getAirportData = async (destination_icao) =>{
    if (destination_icao === '' || !destination_icao) {
        return null
    } else {
        return await axios(`${SERVER_PATH}/graphql`, {
            params: {
                icao: destination_icao,
                params: 'lat,lng'
            }
        }).then(res => {
            console.log(res);
            
            try {
                return res.data.data.icao
            } catch(err) {
                return null
            }
        })
    }
}

export const getAirportName = async (icao) => {
    return await axios(`${SERVER_PATH}/graphql`, {
        params: {
            icao,
            params: 'name'
        }
    }).then(res => {
        try {
            return res.data.data.icao.name
        } catch(err) {
            return null
        }
    })
}

export const getFirBoundaries = async (listOfControllers) => {
    // console.log(listOfControllers[0]);
    
    return await axios(`${SERVER_PATH}/graphql`, {
        params: {
            icao: 'ADR',
            params: 'points'
        }
    }).then(res => {
        try {
            return res.data.data.points
        } catch(err) {
            return null
        }
    })
}

export const getDecodedFlightRoute = async (origin, route, destination) => {
    return await axios(`${SERVER_PATH}/api/decodeRoute`, {
        params: {
            origin,
            route,
            destination
        }
    }).then(res => {
        return res.data
    })
}

export const getMetarData = async (metar) => {
    return await axios(`${SERVER_PATH}/api/metar/${metar}`).then(res => res.data)
}

export const getVatsimData = async () => {
    return await axios(`${SERVER_PATH}/api/vatsim-data`).then(res => res.data)
}