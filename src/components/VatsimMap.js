import React, { Component } from 'react'
import { ScaleLoader } from 'react-spinners'
import axios from 'axios'
import { Map, TileLayer } from 'react-leaflet'
import Leaflet from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import Control from 'react-leaflet-control'
import { ToastContainer, toast, Flip } from 'react-toastify'
import Autocomplete from './Autocomplete'
import { Markers } from './Markers'
import { MAX_BOUNDS, REFRESH_TIME } from '../constants/constants'

export default class VatsimMap extends Component {
  state = {
    callsign: '',
    controllers: [],
    destination_data: null,
    flights: [],
    height: 1000,
    isLoading: true,
    lat: 43.862,
    lng: -79.369,
    selected_flight: null,
    width: 500,
    zoom: 2,
  }

  clusterRef = React.createRef();
  mapRef = React.createRef();
  interval = null;
  toastId = null;

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
            this.map.panTo(
              [this.state.selected_flight.coordinates[1], this.state.selected_flight.coordinates[0]],
              { animate: true, duration: 1.0, easeLinearity: 0.10 }
            )
          }
        }
      });
		}, REFRESH_TIME);
	}

  // Handlers & Functionality

  addAirport = (name, lat, lng) => {
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
      /*
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

      console.log(thing);
      cluster.removeLayer(thing)
      */
    })
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
      this.map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }, 500)
  }

  errorToastMsg = (msg) => {
    this.toastId = toast(msg,
      { autoClose: 5000,
        hideProgressBar: true,
        position: toast.POSITION.TOP_CENTER,
        type: toast.TYPE.ERROR }
    );
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
      // Clear Progress Line & Popups.
      this.clearPolylines();
      this.clearPopups();
    })
  }

  getFlightData = (callback) => {
    this.getVatsimData().then(data => {
      const { flights, controllers } = data;

      if (toast.isActive(this.toastId)) {
        this.serverToastMsg('Connected.', true)
      }

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
        this.serverToastMsg('No connection.', false)
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

  serverToastMsg = (msg, isConnected) => {
    if (!toast.isActive(this.toastId)) {
      this.toastId = toast(
        msg,
        { autoClose: isConnected ? 5000 : false,
          hideProgressBar: true,
          position: toast.POSITION.TOP_CENTER,
          type: isConnected ? toast.TYPE.SUCCESS : toast.TYPE.ERROR
        });
    } else {
      toast.update(
        this.toastId,
        { autoClose: isConnected ? 5000 : false,
          hideProgressBar: true,
          position: toast.POSITION.TOP_CENTER,
          render: msg,
          transition: Flip,
          type: isConnected ? toast.TYPE.SUCCESS : toast.TYPE.ERROR
        });
    }
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
        this.errorToastMsg(`${callsign} does not exist.`);
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
    //   this.addAirport(CITIES[x].name, CITIES[x].coordinates[1], CITIES[x].coordinates[0])
    // }

    this.map = this.mapRef.current.leafletElement;

    // const waypoints = ["EGLL", "SID", "DET", "UQ70", "ITVIP", "UL10", "DVR", "UL9", "KONAN", "UL607", "SPI", "UZ112", "RASVO", "T180", "UNOKO", "STAR", "EDDF"];

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
        <ToastContainer />
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
            disableClusteringAtZoom="6"
            maxClusterRadius="65"
            ref={this.clusterRef}
            showCoverageOnHover={false}
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
              </div>
              <Autocomplete
                items={this.state.flights}
                onSelect={callsign => this.updateCallsign(callsign)}
                placeholder="Search for the callsign..."
                searchCompareValue="callsign"
              />
            </React.Fragment>
          </Control>
        </Map>
      </React.Fragment>
    )
  }
}
