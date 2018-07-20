import React, { Component } from 'react'
import { ScaleLoader } from 'react-spinners'
import axios from 'axios'
import { Map, TileLayer } from 'react-leaflet'
import Leaflet from 'leaflet'
import setText from 'leaflet-textpath'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import Control from 'react-leaflet-control'
import { ToastContainer, toast, Flip } from 'react-toastify'
import Autocomplete from './Autocomplete'
import { Markers } from './Markers'
import ModalIcao from './ModalIcao'
import ModalMetar from './ModalMetar'
import { MAX_BOUNDS, REFRESH_TIME, SERVER_PATH } from '../constants/constants'

import './leaflet-openweathermap'

export default class VatsimMap extends Component {
  state = {
    airport_name: '',
    callsign: '',
    controllers: [],
    destination_data: null,
    flights: [],
    height: 1000,
    icaos: null,
    icao_controllers: null,
    icao_destinations: null,
    icao_departures: null,
    isLoading: true,
    isModalIcaoOpen: false,
    isModalMetarOpen: false,
    lat: 43.862,
    lng: -79.369,
    metar: null,
    selected_flight: null,
    selected_icao: null,
    selected_metar_icao: null,
    width: 500,
    zoom: 2,
  }

  clusterRef = React.createRef()
  flightRef = React.createRef()
  icaoRef = React.createRef()
  mapRef = React.createRef()
  metarRef = React.createRef()
  modalIcaoRef = React.createRef()
  modalMetarRef = React.createRef()
  unfollowBtnRef = React.createRef()

  interval = null
  toastId = null

  // Getters & Setters

  getMapZoom = () => {
    if (this.map) {
      const { lat, lng } = this.map.getCenter()

      this.setState({
        lat,
        lng,
        zoom: this.map.getZoom()
      })
    }
  }

  getViewportSize = () => {
    const width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
          height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)

    return { width, height }
  }

  setResizeEvent = () => {
    window.addEventListener('resize', () => {
      setTimeout(() => {
        const { width, height } = this.getViewportSize()

        this.setState({ width, height })
      }, 500)
    })
  }

  startInterval = () => {
		this.interval = setInterval(() => {
			this.getFlightData(() => {
        if (this.state.selected_flight) {
          this.clearPolylines()

          if (!this.isPlaneOnGround(this.state.selected_flight.groundspeed) && this.state.destination_data) {
            this.drawPolylines(this.state.selected_flight.coordinates, this.state.destination_data)
          } else {
            this.map.panTo(
              [this.state.selected_flight.coordinates[1], this.state.selected_flight.coordinates[0]],
              { animate: true, duration: 1.0, easeLinearity: 0.10 }
            )
          }
        }
      })

      // this.getWeather();
		}, REFRESH_TIME)
	}

  // Handlers & Functionality

  applySelectedFlightData = (flight) => {
    this.setState({
      callsign: flight.callsign,
      lat: flight.coordinates[1],
      lng: flight.coordinates[0],
      zoom: this.isPlaneOnGround(flight.groundspeed) ? 16 : this.state.zoom
    }, () => {
      this.unfollowBtnRef.current.disabled = false
      /*
      const { lat, lng } = this.state,
            cluster = this.clusterRef.current.leafletElement

      let thing = null

      // Remove layer from MarkerClusterGroup
      cluster.eachLayer(layer => {
        // Narrow down the selected Cluster group.
        if (layer._latlng && ((layer._latlng.lat === lat) && (layer._latlng.lng === lng))) {
          const markers = layer.__parent._markers

          // Find the matching LatLng of the selected Flight that's in the Cluster.
          for (let i in markers) {
            if (markers[i]._latlng.lat === layer._latlng.lat &&
                markers[i]._latlng.lng === layer._latlng.lng) {
              thing = markers[i]

              break
            }
          }
        }
      })

      console.log(thing)
      cluster.removeLayer(thing)
      */
    })
  }

  clearPopups = () => {
    this.map.eachLayer(layer => layer.closePopup())
  }

  clearPolylines = () => {
    const layers = this.map._layers

    for(let i in layers) {
      if(layers[i]._path !== undefined) {
        try {
          this.map.removeLayer(layers[i])
        }
        catch(e) {
          this.errorToastMsg("Could not draw the Flight Path.")
        }
      }
    }
  }

  drawPolylines = (coordinates, data, icao) => {
    const latlngs = [[coordinates[1], coordinates[0]],[parseFloat(data.lat), parseFloat(data.lng)]],
          polyline = new Leaflet.polyline(latlngs, { color: 'red' }).addTo(this.map),
          circle = new Leaflet.circle([parseFloat(data.lat), parseFloat(data.lng)],{ color: 'red' }).addTo(this.map),
          heading = this.state.selected_flight.heading

    // Add 'Distance to Go' text to the Polyline in Kilometers.
    polyline.setText(`${this.getDistanceToDestination(latlngs)} KM`, {
      attributes: {'font-weight': 'bold','font-size': '24'},
      center: true,
      offset: heading && (heading >= 0 && heading <= 180) ? -15 : 35,
      orientation: heading && (heading >= 0 && heading <= 180) ? 0 : 'flip'
    })

    setTimeout(() => {
      this.map.fitBounds(polyline.getBounds(), { padding: [50, 50] })
    }, 500)
  }

  errorToastMsg = (msg) => {
    this.toastId = toast(msg,
      { autoClose: 5000,
        hideProgressBar: true,
        position: toast.POSITION.TOP_CENTER,
        type: toast.TYPE.ERROR }
    )
  }

  findFlight = (flight, isCity) => {
    this.clearPolylines()
    this.clearPopups()

    console.log(flight);

    this.getAirportData(flight.planned_destairport).then(destination_data => {
      if (destination_data) {
        this.setState({ selected_flight: flight, destination_data }, () => {
          if(!this.isPlaneOnGround(flight.groundspeed)) {
            this.drawPolylines(flight.coordinates, destination_data, flight.planned_destairport)
          }

          this.getDecodedFlightRoute(flight.planned_depairport, flight.planned_route ,flight.planned_destairport)

          this.applySelectedFlightData(flight)
        })
      } else {
        this.setState({ selected_flight: flight }, () => {
          this.applySelectedFlightData(flight)
        })
      }
    }).catch(err => {
      this.errorToastMsg('There is no destination data for this flight.')
    })
  }

  getAirportPosition = (icao) => {
    this.getAirportData(icao).then(icao_data => {
      this.setState({
        lat: parseFloat(icao_data.lat),
        lng: parseFloat(icao_data.lng),
        zoom: 13
      })
    })
  }

  getDeg2rad = (deg) => {
    return deg * (Math.PI / 180)
  }

  getDistanceToDestination = (latlngs) => {
    try {
      const flight_coords_lat = latlngs[0][0],
            flight_coords_lng = latlngs[0][1],
            airport_coords_lat = latlngs[1][0],
            airport_coords_lng = latlngs[1][1]

      const R = 6371, // Radius of the earth in km
            dLat = this.getDeg2rad(airport_coords_lat - flight_coords_lat),
            dLon = this.getDeg2rad(airport_coords_lng - flight_coords_lng),
            a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.getDeg2rad(flight_coords_lat)) * Math.cos(this.getDeg2rad(airport_coords_lat)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2),
            c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
            d = R * c // Distance in km

      return Math.round(d)
    } catch (err) {
      return null
    }
  }

  getFlightData = (callback) => {
    this.getVatsimData().then(data => {
      const { flights,
              controllers,
              icaos } = data

      if (toast.isActive(this.toastId)) {
        this.serverToastMsg('Connected.', true)
      }

      this.setState({ flights,
                      controllers,
                      icaos }, () => {
        if (this.state.selected_flight) {
          const result = this.state.flights.find(flight => {
            return flight.callsign.toUpperCase() === this.state.selected_flight.callsign.toUpperCase()
          })

          this.setState({ selected_flight: result }, () => {
            callback ? callback() : null
          })
        } else {
          callback ? callback() : null
        }
      })
    })
    .catch(err => {
      this.setState({
        controllers: [],
        flights: [],
        icaos: [],
        isLoading: false,
      }, () => {
        this.serverToastMsg('No connection.', false)
      })
    })
  }

  getWeather = () => {
    const options = { opacity: 0.5 },
          osm = Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
          rain = Leaflet.OWM.rain(options),
          clouds = Leaflet.OWM.clouds(options),
          precipitation = Leaflet.OWM.precipitation(options),
          wind = Leaflet.OWM.wind(options),
          overlayMaps = {
            'Rain': rain,
            'Clouds': clouds,
            'Precipitation': precipitation,
            'Wind': wind },
          baseMaps = {};

    const layerControl = Leaflet.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(this.map);
  }

  handleEnterKey = (e) => {
    if (e.key === 'Enter') this.searchFlight()
  }

  handleReset = () => {
    this.setState({
      callsign: '',
      destination_data: null,
      lat: 43.862,
      lng: -79.369,
      selected_flight: null,
      zoom: 2
    }, () => {
      // Clear Progress Line, Popups, and Inputs.
      this.clearPolylines()
      this.clearPopups()
      this.flightRef.current.inputRef.current.value = ''
      this.icaoRef.current.inputRef.current.value = ''
      this.metarRef.current.value = ''
    })
  }

  handleUnfollow = () => {
    this.setState({
      callsign: '',
      destination_data: null,
      selected_flight: null
    }, () => {
      // Clear Progress Line, Popups, and Inputs.
      this.clearPolylines()
      this.clearPopups()
      this.flightRef.current.inputRef.current.value = ''
      this.unfollowBtnRef.current.disabled = true
    })
  }

  isPlaneOnGround = (groundspeed) => {
    return groundspeed <= 80
  }

  openIcaoModal = (selected_icao) => {
    this.getAirportName(selected_icao).then(airport_name => {
      if (this.state.icaos.includes(selected_icao)) {
        const icao_departures = this.state.flights.filter(flight => selected_icao === flight.planned_depairport),
              icao_destinations = this.state.flights.filter(flight => selected_icao === flight.planned_destairport),
              icao_controllers = this.state.controllers.filter(controller => controller.callsign.indexOf(selected_icao) > -1)

        this.setState({ icao_departures, icao_destinations, icao_controllers, selected_icao, airport_name },
          () => { this.modalIcaoRef.current.toggleModal() })
      } else {
        this.errorToastMsg('This ICAO is not listed.')
      }
    })
  }

  openMetarModal = (selected_metar) => {
    this.getAirportName(selected_metar).then(airport_name => {
      this.getMetarData(selected_metar).then(metar => {
        if (metar) {
          this.setState({ metar, selected_metar_icao: selected_metar, airport_name }, () => {
            this.modalMetarRef.current.toggleModal()
          })
        } else {
          this.errorToastMsg('There is no METAR for this ICAO.')
        }
      })
    })
  }

  searchFlight = () => {
    const callsign = document.getElementsByName('flightSearch')[0].value

    this.updateCallsign(callsign)
  }

  serverToastMsg = (msg, isConnected) => {
    if (!toast.isActive(this.toastId)) {
      this.toastId = toast(
        msg,
        { autoClose: isConnected ? 5000 : false,
          hideProgressBar: true,
          position: toast.POSITION.TOP_CENTER,
          type: isConnected ? toast.TYPE.SUCCESS : toast.TYPE.ERROR
        })
    } else {
      toast.update(
        this.toastId,
        { autoClose: isConnected ? 5000 : false,
          hideProgressBar: true,
          position: toast.POSITION.TOP_CENTER,
          render: msg,
          transition: Flip,
          type: isConnected ? toast.TYPE.SUCCESS : toast.TYPE.ERROR
        })
    }
  }

  updateCallsign = (callsign) => {
    if (this.state.flights.length > 0) {
      const flight = this.state.flights.find(flight => {
        return flight.callsign.toUpperCase() === callsign.toUpperCase()
      })

      if (flight) {
        this.setState({ callsign }, () => {
          this.findFlight(flight)
        })
      } else {
        this.errorToastMsg(`${callsign} does not exist.`)
      }
    }
  }

  // Data Fetchers

  async getVatsimData() {
    return await axios(`${SERVER_PATH}/api/vatsim-data`)
      .then(res => res.data)
  }

  async getAirportData(destination_icao) {
    if (destination_icao === '' || !destination_icao) {
      return null
    } else {
      return await axios(`${SERVER_PATH}/graphql`, {
        params: {
          icao: destination_icao,
          params: 'lat,lng'
        }
      })
      .then(res => {
        try {
          return res.data.data.icao
        } catch(err) {
          return null
        }
      })
      .catch(err => this.errorToastMsg('There was a problem retrieving the Destination Airport Data.'))
    }
  }

  async getMetarData(metar) {
    return await axios(`${SERVER_PATH}/api/metar/${metar}`)
      .then(res => res.data)
  }

  async getAirportName(icao) {
    return await axios(`${SERVER_PATH}/graphql`, {
      params: {
        icao: icao,
        params: 'name'
      }
    })
    .then(res => {
      try {
        return res.data.data.icao.name
      } catch(err) {
        return null
      }
    })
  }

  async getDecodedFlightRoute(origin, route, destination) {
    return await axios(`${SERVER_PATH}/api/decodeRoute`, {
      params: {
        origin,
        route,
        destination
      }
    })
    .then(res => {
      if (!res.data) {
        console.log('nodata.');
      } else {
        console.log(res.data);
      }
    })
  }

  // React Lifecycle Hooks

  componentDidMount = () => {
    const { width, height } = this.getViewportSize()

    this.map = this.mapRef.current.leafletElement

    setTimeout(() => {
      this.setState({ width, height }, () => {
        if (!this.interval) {
          this.setResizeEvent()
          this.startInterval()
          this.getFlightData(() => {
            this.getWeather()
            this.setState({ isLoading: false }, () => this.unfollowBtnRef.current.disabled = true )
          })
          window.dispatchEvent(new Event('resize'))
        }
      })
    }, 0)
  }

  // myWindroseMarker = (data) => {
  // 	const content = '<canvas id="id_' + data.id + '" width="50" height="50"></canvas>',
  //         icon = Leaflet.divIcon({html: content, iconSize: [50,50], className: 'owm-div-windrose'});
  //
  // 	return Leaflet.marker([data.coord.Lat, data.coord.Lon], {icon: icon, clickable: false});
  // }

  render = () => {
    return (
      <React.Fragment>
        <div className={'loading-spinner ' + (this.state.isLoading ? null : '--hide-loader')}>
          <ScaleLoader
            color={'#123abc'}
            loading={this.state.isLoading}
          />
        </div>
        <ToastContainer />
        <ModalIcao
          airport_name={this.state.airport_name}
          icao={this.state.selected_icao}
          items={[this.state.icao_departures, this.state.icao_destinations, this.state.icao_controllers]}
          returnData={callsign => this.updateCallsign(callsign)}
          ref={this.modalIcaoRef}
          returnICAO={e => this.getAirportPosition(e)}
          toggleModal={this.state.isModalIcaoOpen}
        />
        <ModalMetar
          airport_name={this.state.airport_name}
          icao={this.state.selected_metar_icao}
          metar={this.state.metar}
          ref={this.modalMetarRef}
          returnICAO={e => this.getAirportPosition(e)}
          toggleModal={this.state.isModalMetarOpen}
        />
        <Map
          center={[this.state.lat, this.state.lng]}
          maxBounds={MAX_BOUNDS}
          onZoomEnd={this.getMapZoom.bind(this)}
          ref={this.mapRef}
          style={{
            height: this.state.height,
            width: this.state.width
          }}
          zoom={this.state.zoom}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MarkerClusterGroup
            disableClusteringAtZoom="13"
            maxClusterRadius="65"
            ref={this.clusterRef}
            showCoverageOnHover={false}
            spiderfyOnMaxZoom={false}
          >
            <Markers
              flights={this.state.flights}
              selectedFlight={this.state.selected_flight}
              updateCallsign={this.updateCallsign.bind(this)}
            />
          </MarkerClusterGroup>
          <Control position="topleft">
            <React.Fragment>
              <div>
                <button onClick={this.handleReset.bind(this)}>
                  Reset View
                </button>
                <button
                  ref={this.unfollowBtnRef}
                  onClick={this.handleUnfollow.bind(this)}>Unfollow
                </button>
              </div>
              <Autocomplete
                items={this.state.flights}
                onSelect={callsign => this.updateCallsign(callsign)}
                placeholder="Search for the callsign..."
                ref={this.flightRef}
                searchCompareValue="callsign"
              />
              <Autocomplete
                items={this.state.icaos}
                onSelect={icao => this.openIcaoModal(icao)}
                placeholder="Search for the ICAO..."
                ref={this.icaoRef}
                searchCompareValue="planned_destairport"
              />
              <input
                onKeyPress={event => {
                  if (event.key === 'Enter') this.openMetarModal(event.target.value)
                }}
                name='metar'
                ref={this.metarRef}
                placeholder='Search for the METAR...'
                type='search'
              />
            </React.Fragment>
          </Control>
        </Map>
      </React.Fragment>
    )
  }
}
