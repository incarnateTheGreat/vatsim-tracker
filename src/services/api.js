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
        try {
            return res.data.data.icao
        } catch(err) {
            return null
        }
        }).catch(err => this.errorToastMsg('There was a problem retrieving the Destination Airport Data.'))
    }
}

export const getAirportName = async (icao) => {
    return await axios(`${SERVER_PATH}/graphql`, {
        params: {
            icao: icao,
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

export const getDecodedFlightRoute = async (origin, route, destination) => {
    return await axios(`${SERVER_PATH}/api/decodeRoute`, {
        params: {
            origin,
            route,
            destination
        }
    }).then(res => res.data)
}

export const getMetarData = async (metar) => {
    return await axios(`${SERVER_PATH}/api/metar/${metar}`).then(res => res.data)
}

export const getVatsimData = async () => {
    return await axios(`${SERVER_PATH}/api/vatsim-data`).then(res => res.data)
}