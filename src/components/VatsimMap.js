import React, { Component, Fragment } from 'react'
import { ScaleLoader } from 'react-spinners'
import axios from 'axios'
import { Map, TileLayer } from 'react-leaflet'
import Leaflet from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import Control from 'react-leaflet-control'
import { ToastContainer, toast, Flip } from 'react-toastify'
import Autocomplete from './Autocomplete'
import { Markers } from './Markers'
import ModalIcao from './ModalIcao'
import ModalMetar from './ModalMetar'
import { MAX_BOUNDS, REFRESH_TIME, SERVER_PATH } from '../constants/constants'

/*eslint-disable */
import setText from 'leaflet-textpath'
/*eslint-disable */

// import './leaflet-openweathermap'

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
    })
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

  drawPolylines = (coordinates, data) => {
    const latlngs = [[coordinates[1], coordinates[0]],[parseFloat(data.lat), parseFloat(data.lng)]],
          polyline = new Leaflet.polyline(latlngs, { color: 'red' }).addTo(this.map),
          heading = this.state.selected_flight.heading,
          distanceKM = this.getDistanceToDestination(latlngs),
          distanceNMI = this.getNauticalMilesFromKM(distanceKM)
    
    /*eslint-disable */
    const circle = new Leaflet.circle([parseFloat(data.lat), parseFloat(data.lng)],{ color: 'red' }).addTo(this.map)
    /*eslint-disable */

    // Add 'Distance to Go' text to the Polyline in Kilometers.
    polyline.setText(`${distanceKM} KM to go (${distanceNMI} nmi)`, {
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

  findFlight = (flight) => {
    this.clearPolylines()

    this.getAirportData(flight.planned_destairport).then(destination_data => {
      if (destination_data) {
        this.setState({ isLoading: false, selected_flight: flight, destination_data }, () => {
          if(!this.isPlaneOnGround(flight.groundspeed)) {
            this.drawPolylines(flight.coordinates, destination_data, flight.planned_destairport)
          }

          this.applySelectedFlightData(flight)
        })
      } else {
        this.setState({ isLoading: false, selected_flight: flight }, () => {
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

          this.setState({ selected_flight: result }, () => callback ? callback() : null)
        } else {
          this.handleUnfollow()

          if (callback) callback()
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

  getNauticalMilesFromKM = (km) => {
    return Math.round(km * 0.5399568)
  }

  getWeather = () => {
    const options = { opacity: 0.5 },
          osm = Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
          clouds = Leaflet.OWM.clouds(options),
          precipitation = Leaflet.OWM.precipitation(options),
          windrose = Leaflet.OWM.current({
            appId: 'a22e7429bbe086045388e31142cd915f',
            intervall: 15,
            minZoom: 3,
            lang: 'EN',
            markerFunction: this.myWindroseMarker,
            popup: false,
            clusterSize: 50,
            imageLoadingBgUrl: 'https://openweathermap.org/img/w0/iwind.png'
          }),
          overlayMaps = {
            'Clouds': clouds,
            'Precipitation': precipitation,
            // 'Wind Rose': windrose
          },
          baseMaps = {}

    // windrose.on('owmlayeradd', this.windroseAdded, windrose)

    Leaflet.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(this.map)
  }

  myWindroseMarker = data => {
  	const content = '<canvas id="id_' + data.id + '" width="50" height="50" style="border: 1px solid red"></canvas>',
          icon = Leaflet.divIcon({html: content, iconSize: [50,50], className: 'owm-div-windrose'});

  	return Leaflet.marker([data.coord.Lat, data.coord.Lon], {icon: icon, clickable: false});
  }

  windroseAdded = e => {
  	for (var i in this.map._layers) {
  		var m = this.map._layers[i];
  		var cv = document.getElementById('id_' + m.options.owmId);
  		for (var j in this._cache._cachedData.list) {
  			var station = this._cache._cachedData.list[j];
  			if (station.id === m.options.owmId) {
  				this.myWindroseDrawCanvas(station, this);
  			}
  		}
  	}
  }

  myWindroseDrawCanvas = (data, owm) => {
    console.log('myWindroseDrawCanvas');
  	var canvas = document.getElementById('id_' + data.id);
  	canvas.title = data.name;
  	var angle = 0;
  	var speed = 0;
  	var gust = 0;
  	if (typeof data.wind !== 'undefined') {
  		if (typeof data.wind.speed !== 'undefined') {
  			canvas.title += ', ' + data.wind.speed + ' m/s';
  			canvas.title += ', ' + owm._windMsToBft(data.wind.speed) + ' BFT';
  			speed = data.wind.speed;
  		}
  		if (typeof data.wind.deg !== 'undefined') {
  			canvas.title += ', ' + owm._directions[(data.wind.deg/22.5).toFixed(0)];
  			angle = data.wind.deg;
  		}
  		if (typeof data.wind.gust !== 'undefined') {
  			gust = data.wind.gust;
  		}
  	}
  	if (canvas.getContext && speed > 0) {
  		var red = 0;
  		var green = 0;
  		if (speed <= 10) {
  			green = 10*speed+155;
  			red = 255*speed/10.0;
  		} else {
  			red = 255;
  			green = 255-(255*(Math.min(speed, 21)-10)/11.0);
  		}
  		var ctx = canvas.getContext('2d');
  		ctx.translate(25, 25);
  		ctx.rotate(angle*Math.PI/180);
  		ctx.fillStyle = 'rgb(' + Math.floor(red) + ',' + Math.floor(green) + ',' + 0 + ')';
  		ctx.beginPath();
  		ctx.moveTo(-15, -25);
  		ctx.lineTo(0, -10);
  		ctx.lineTo(15, -25);
  		ctx.lineTo(0, 25);
  		ctx.fill();

  		// draw inner arrow for gust
  		if (gust > 0 && gust !== speed) {
  			if (gust <= 10) {
  				green = 10*gust+155;
  				red = 255*gust/10.0;
  			} else {
  				red = 255;
  				green = 255-(255*(Math.min(gust, 21)-10)/11.0);
  			}
  			canvas.title += ', gust ' + data.wind.gust + ' m/s';
  			canvas.title += ', ' + owm._windMsToBft(data.wind.gust) + ' BFT';
  			ctx.fillStyle = 'rgb(' + Math.floor(red) + ',' + Math.floor(green) + ',' + 0 + ')';
  			ctx.beginPath();
  			ctx.moveTo(-15, -25);
  			ctx.lineTo(0, -10);
  			ctx.lineTo(0, 25);
  			ctx.fill();
  		}
  	} else {
  		canvas.innerHTML = '<div>'
  				+ (typeof data.wind !== 'undefined' && typeof data.wind.deg !== 'undefined' ? data.wind.deg + '°' : '')
  				+ '</div>';
  	}
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
      this.flightRef.current.inputRef.current.value = ''
      this.unfollowBtnRef.current.disabled = true
    })
  }

  isPlaneOnGround = (groundspeed) => {
    return groundspeed <= 80
  }

  openIcaoModal = (selected_icao) => {
    this.setState({ isLoading: true }, () => {
      this.getAirportName(selected_icao).then(airport_name => {
        if (this.state.icaos.includes(selected_icao)) {
          const icao_departures = this.state.flights.filter(flight => selected_icao === flight.planned_depairport),
                icao_destinations = this.state.flights.filter(flight => selected_icao === flight.planned_destairport),
                icao_controllers = this.state.controllers.filter(controller => {
                  // If ICAO only has 3 characters for a prefix, find it.
                  if (controller.callsign.substring(0,4).indexOf('_') > 0) {
                    return selected_icao.includes(controller.callsign.substring(0,3))
                  }
  
                  return controller.callsign.indexOf(selected_icao) > -1
                });
  
          this.setState({ 
            airport_name,
            icao_controllers,
            icao_departures,
            icao_destinations,
            isLoading: false,
            selected_icao }, () => { this.modalIcaoRef.current.toggleModal() })
        } else {
          this.errorToastMsg('This ICAO is not listed.')
        }
      })
    })
  }

  openMetarModal = (selected_metar) => {
    this.setState({ isLoading: true }, () => {
      this.getAirportName(selected_metar).then(airport_name => {
        this.getMetarData(selected_metar).then(metar => {
          if (metar) {
            this.setState({
              airport_name,
              isLoading: false,
              metar, 
              selected_metar_icao: selected_metar }, () => {
              this.modalMetarRef.current.toggleModal()
            })
          } else {
            this.errorToastMsg('There is no METAR for this ICAO.')
          }
        })
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
        this.setState({ isLoading: true, callsign }, () => {
          this.findFlight(flight)
        })
      } else {
        this.errorToastMsg(`${callsign} does not exist.`)
      }
    }
  }

  // Data Fetchers

  async getVatsimData() {
    return await axios(`${SERVER_PATH}/api/vatsim-data`).then(res => res.data)
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
      }).then(res => {
        try {
          return res.data.data.icao
        } catch(err) {
          return null
        }
      }).catch(err => this.errorToastMsg('There was a problem retrieving the Destination Airport Data.'))
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

  // TODO: DECIDE WHETHER OR NOT TO KEEP THIS.
  // async getDecodedFlightRoute(origin, route, destination) {
  //   return await axios(`${SERVER_PATH}/api/decodeRoute`, {
  //     params: {
  //       origin,
  //       route,
  //       destination
  //     }
  //   })
  //   .then(res => {
  //     if (!res.data) {
  //       console.log('nodata.');
  //     } else {
  //       console.log(res.data);
  //     }
  //   })
  // }

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
            // this.getWeather()
            this.setState({ isLoading: false }, () => this.unfollowBtnRef.current.disabled = true )
          })
          window.dispatchEvent(new Event('resize'))
        }
      })
    }, 0)
  }

  render = () => {
    return (
      <Fragment>
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
            <Fragment>
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
            </Fragment>
          </Control>
        </Map>
      </Fragment>
    )
  }
}
