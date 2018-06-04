import React, { Component } from 'react'
import { ScaleLoader } from 'react-spinners'
import axios from 'axios'
import { Map, TileLayer } from 'react-leaflet'
import Leaflet from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import Control from 'react-leaflet-control'
import { ToastContainer, toast } from 'react-toastify'
import { Markers } from './Markers'
import { CLIENT_LABELS,
         MAX_BOUNDS } from '../constants/constants'

export default class MapLeaflet extends Component {
  state = {
    callsign: '',
    controllers: [],
    destination_data: null,
    flights: [],
    height: 1000,
    isLoading: true,
    lat: 43.862,
    lng: -79.369,
    search_value: '',
    selected_flight: null,
    width: 500,
    zoom: 2,
  }

  clusterRef = React.createRef();
  mapRef = React.createRef();
  interval = null;

  // Getters & Setters

  getMapZoom = () => {
    if (this.map) {
      const { lat, lng } = this.map.getCenter();

      this.setState({
        lat,
        lng,
        zoom: this.map.getZoom()
      })
    }
  }

  getViewportSize = () => {
    const width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
          height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    return { width, height }
  }

  setResizeEvent = () => {
    window.addEventListener('resize', () => {
      setTimeout(() => {
        const { width, height } = this.getViewportSize()

        this.setState({ width, height })
      }, 500);
    })
  }

  startInterval = () => {
		this.interval = setInterval(() => {
			this.getFlightData(() => {
        if (this.state.selected_flight) {
          this.clearPolylines();

          if (!this.isPlaneOnGround(this.state.selected_flight.groundspeed) && this.state.destination_data) {
            this.drawPolylines(this.state.selected_flight.coordinates, this.state.destination_data);
          } else {
            this.map.flyTo([this.state.selected_flight.coordinates[1], this.state.selected_flight.coordinates[0]])
          }
        }
      });
		}, 30000);
	}

  // Handlers & Functionality

  addFlight = (name, lat, lng) => {
    const { flights } = this.state

    flights.push({ name: name, coordinates: [lat, lng] })

    this.setState({ flights })
  }

  applySelectedFlightData = (flight) => {
    this.setState({
      callsign: flight.callsign,
      lat: flight.coordinates[1],
      lng: flight.coordinates[0],
      zoom: this.isPlaneOnGround(flight.groundspeed) ? 16 : this.state.zoom
    }, () => {
      const { lat, lng } = this.state,
            cluster = this.clusterRef.current.leafletElement;

      let thing = null;

      // Remove layer from MarkerClusterGroup
      cluster.eachLayer(layer => {
        // Narrow down the selected Cluster group.
        if (layer._latlng && ((layer._latlng.lat === lat) && (layer._latlng.lng === lng))) {
          const markers = layer.__parent._markers;

          // Find the matching LatLng of the selected Flight that's in the Cluster.
          for (let i in markers) {
            if (markers[i]._latlng.lat === layer._latlng.lat &&
                markers[i]._latlng.lng === layer._latlng.lng) {
              thing = markers[i];

              break;
            }
          }
        }
      })

      // console.log(thing);
      //
      // cluster.removeLayer(thing)
    })
  }

  checkFlightPosition = (clientInterface) => {
    return ((isNaN(clientInterface.longitude) || clientInterface.longitude === '') ||
            (isNaN(clientInterface.latitude) || clientInterface.latitude === ''));
  }

  clearPopups = () => {
    this.map.eachLayer(layer => layer.closePopup())
  }

  clearPolylines = () => {
    const layers = this.map._layers;

    for(let i in layers) {
      if(layers[i]._path !== undefined) {
        try {
          this.map.removeLayer(layers[i]);
        }
        catch(e) {
          this.errorToastMsg("Could not draw the Flight Path.");
          console.log("problem with " + e + layers[i]);
        }
      }
    }
  }

  drawPolylines = (coordinates, data) => {
    const latlngs = [
      [coordinates[1], coordinates[0]],
      [parseFloat(data.lat), parseFloat(data.lon)]
    ],
    polyline = new Leaflet.polyline(latlngs, { color: 'red' }).addTo(this.map);

    setTimeout(() => {
      this.map.fitBounds(polyline.getBounds());
    }, 500)
  }

  errorToastMsg = (errorMessage) => {
    toast.error(errorMessage);
  }

  findFlight = (flight, isCity) => {
    this.clearPolylines();
    this.clearPopups();

    console.log(flight);

    this.getAirportData(flight.planned_destairport).then(destination_data => {
      if (destination_data) {
        this.setState({ selected_flight: flight, destination_data }, () => {
          if(!this.isPlaneOnGround(flight.groundspeed)) {
            this.drawPolylines(flight.coordinates, destination_data);
          }

          this.applySelectedFlightData(flight);
        })
      } else {
        this.setState({ selected_flight: flight }, () => {
          this.map.flyTo([flight.coordinates[1], flight.coordinates[0]])
          this.applySelectedFlightData(flight);
        })
      }
    }).catch(err => {
      this.errorToastMsg('There is no destination data for this flight.');
    })
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
      // Clear Search Input.
      const flightSearchInput = document.getElementsByName('flightSearch')[0];
      flightSearchInput.value = '';

      // Clear Progress Line & Popups.
      this.clearPolylines();
      this.clearPopups();
    })
  }

  getFlightData = (callback) => {
    let flights = [];

    this.getVatsimData().then(data => {
      for (let i = 0; i < data.length; i++) {
        let clientInterface = {},
            clientDataSplit = data[i].split(':');

        for (let j = 0; j < CLIENT_LABELS.length; j++) {
          clientInterface[CLIENT_LABELS[j]] = clientDataSplit[j];
        }

        if (!this.checkFlightPosition(clientInterface)) {
          flights.push({
            isController: clientInterface.frequency !== "" ? true : false,
            name: clientInterface.realname,
            callsign: clientInterface.callsign,
            coordinates: [parseFloat(clientInterface.longitude), parseFloat(clientInterface.latitude)],
            frequency: clientInterface.frequency,
            altitude: clientInterface.altitude,
            planned_aircraft: clientInterface.planned_aircraft,
            heading: clientInterface.heading,
            groundspeed: clientInterface.groundspeed,
            transponder: clientInterface.transponder,
            planned_depairport: clientInterface.planned_depairport,
            planned_destairport: clientInterface.planned_destairport,
            planned_route: clientInterface.planned_route
          })
        }
      }

      const controllers = flights.filter(client => client.frequency !== "")

      this.setState({ flights, controllers }, () => {
        if (this.state.selected_flight) {
          const result = this.state.flights.find(flight => {
            return flight.callsign.toUpperCase() === this.state.selected_flight.callsign.toUpperCase()
          })

          this.setState({ selected_flight: result }, () => {
            callback ? callback() : null;
          })
        } else {
          callback ? callback() : null;
        }
      });
    })
    .catch(err => {
      this.setState({ isLoading: false }, () => {
        this.errorToastMsg('No connection.')
      })
    })
  }

  handleEnterKey = (e) => {
    if (e.key === 'Enter') this.searchFlight()
  }

  isPlaneOnGround = (groundspeed) => {
    return groundspeed <= 80;
  }

  searchFlight = () => {
    const callsign = document.getElementsByName('flightSearch')[0].value;

    this.updateCallsign(callsign);
  }

  updateCallsign = (callsign) => {
    if (this.state.flights.length > 0) {
      const flight = this.state.flights.find(flight => {
        return flight.callsign.toUpperCase() === callsign.toUpperCase()
      })

      if (flight) {
        this.setState({ callsign }, () => {
          this.findFlight(flight);
        })
      } else {
        this.errorToastMsg('Flight does not exist.');
      }
    }
  }

  // Data Fetchers

  async getVatsimData() {
    return await axios('http://localhost:8000/api/vatsim-data')
      .then(res => res.data)
  }

  async getAirportData(destination_icao) {
    return await axios(`http://localhost:8000/api/get-airports/${destination_icao}`)
      .then(res => res.data)
  }

  // React Lifecycle Hooks

  componentDidMount = () => {
    const { width, height } = this.getViewportSize()

    // for (let x = 0; x < CITIES.length; x++) {
    //   this.addFlight(CITIES[x].name, CITIES[x].coordinates[1], CITIES[x].coordinates[0])
    // }

    this.map = this.mapRef.current.leafletElement;

    const waypoints = ["EGLL", "SID", "DET", "UQ70", "ITVIP", "UL10", "DVR", "UL9", "KONAN", "UL607", "SPI", "UZ112", "RASVO", "T180", "UNOKO", "STAR", "EDDF"];

    // const yeah = thing.FSData.Waypoint.filter(waypoint => {
      // for (let x in waypoints) {
      //   for (let y in thing.FSData.Waypoint) {
      //     console.log(waypoints[x] === thing.FSData.Waypoint[y]._waypointIdent);
      //     // return waypoint._waypointIdent === waypoints[x]
      //   }
      // }
    // })

    // console.log(yeah);

    setTimeout(() => {
      this.setState({ width, height }, () => {
        if (!this.interval) {
          this.setResizeEvent();
          this.startInterval();
          this.getFlightData(() => {
            this.setState({ isLoading: false })
          });
          window.dispatchEvent(new Event('resize'));
        }
      })
    }, 0);
  }

  render = () => {
    return (
      <React.Fragment>
        <div className={'loading-spinner ' + (this.state.isLoading ? null : '--hide-loader')}>
          <ScaleLoader
            color={'#123abc'}
            loading={this.state.isLoading}
          />
        </div>
        <ToastContainer
          position="top-center"
          autoClose={5000}
          hideProgressBar={true}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          draggable
        />
        <Map
          ref={this.mapRef}
          center={[this.state.lat, this.state.lng]}
          zoom={this.state.zoom}
          maxBounds={MAX_BOUNDS}
          onZoomEnd={this.getMapZoom.bind(this)}
          style={{
            height: this.state.height,
            width: this.state.width
          }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MarkerClusterGroup
            ref={this.clusterRef}
            disableClusteringAtZoom="6"
            showCoverageOnHover={false}
            maxClusterRadius="65"
          >
            <Markers
              flights={this.state.flights}
              updateCallsign={this.updateCallsign.bind(this)}
            />
          </MarkerClusterGroup>
          <Control position="topleft">
            <React.Fragment>
              <div>
                <button onClick={this.handleReset.bind(this)}>
                  Reset View
                </button>
              </div>
              <div>
                <input
                  type="text"
                  name="flightSearch"
                  onKeyPress={this.handleEnterKey}
                  placeholder="Search for the callsign..." />
                <input
                  type="button"
                  value="Search"
                  onClick={this.searchFlight} />
              </div>
            </React.Fragment>
          </Control>
        </Map>
      </React.Fragment>
    )
  }
}
