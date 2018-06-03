import React, { Component } from 'react'
import axios from 'axios'
import { Map, TileLayer, Popup, Tooltip } from 'react-leaflet'
import Leaflet from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import Control from 'react-leaflet-control'
import RotatedMarker from 'react-leaflet-rotatedmarker'
import { ToastContainer, toast } from 'react-toastify'
import { CLIENT_LABELS,
         MAX_BOUNDS } from '../constants/constants'

// import thing from '../data/airac.json'

export default class MapLeaflet extends Component {
  state = {
    lat: 43.862,
    lng: -79.369,
    zoom: 2,
    height: 1000,
    width: 500,
    flights: [],
    controllers: [],
    callsign: '',
    selected_flight: null,
    destination_data: null
  }

  interval = null;
  myRefs = React.createRef();

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

  handleReset = () => {
    this.setState({
      lat: 43.862,
      lng: -79.369,
      zoom: 3,
      callsign: '',
      selected_flight: null,
      destination_data: null
    }, () => {
      // Clear Search Input.
      const flightSearchInput = document.getElementsByName('flightSearch')[0];
      flightSearchInput.value = '';

      // Clear Progress Line & Popups.
      this.clearPolylines();
      this.clearPopups();
    })
  }

  clearPopups = () => {
    this.map.eachLayer(layer => {
      layer.closePopup();
    })
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

  searchFlight = () => {
    const callsign = document.getElementsByName('flightSearch')[0].value;

    this.updateCallsign(callsign);
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
    })
  }

  isPlaneOnGround = (groundspeed) => {
    return groundspeed <= 80;
  }

  applySelectedFlightData = (flight) => {
    this.setState({
      callsign: flight.callsign,
      lat: flight.coordinates[1],
      lng: flight.coordinates[0],
      zoom: this.isPlaneOnGround(flight.groundspeed) ? 16 : 10
    }, () => {
      const { lat, lng } = this.state;

      // Programmatically open the Data Popup.
      this.map.eachLayer(layer => {
        if (layer._latlng && ((layer._latlng.lat === lat) && (layer._latlng.lng === lng))) {
          layer.openPopup();
        }
      });
    })
  }

  checkFlightPosition = (clientInterface) => {
    return ((isNaN(clientInterface.longitude) || clientInterface.longitude === '') ||
            (isNaN(clientInterface.latitude) || clientInterface.latitude === ''));
  }

  errorToastMsg = (errorMessage) => {
    toast.error(errorMessage);
  }

  async getVatsimData() {
    return await axios('http://localhost:8000/api/vatsim-data')
      .then(res => res.data);
  }

  async getAirportData(destination_icao) {
    return await axios(`http://localhost:8000/api/get-airports/${destination_icao}`)
      .then(res => res.data);
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
  }

  addFlight = (name, lat, lng) => {
    const { flights } = this.state

    flights.push({ name: name, coordinates: [lat, lng] })

    this.setState({ flights })
  }

  buildFlightMarkers = () => {
    return this.state.flights.map((position, idx) => {
      const { isController,
              name,
              callsign,
              altitude,
              heading,
              groundspeed,
              planned_depairport,
              planned_destairport,
              planned_aircraft } = position,
              coords = [position.coordinates[1], position.coordinates[0]]

      let plan = false,
          icon = null;

      if (isController) {
        icon = new Leaflet.Icon({
          iconUrl: require('../images/controller-icon.png'),
          iconAnchor: null,
          shadowUrl: null,
          shadowSize: null,
          shadowAnchor: null,
          iconSize: new Leaflet.Point(30, 30),
          className: 'controller-icon'
        })
      } else {
        icon = new Leaflet.Icon({
          iconUrl: require('../images/airplane-icon.png'),
          iconAnchor: null,
          shadowUrl: null,
          shadowSize: null,
          shadowAnchor: null,
          iconSize: new Leaflet.Point(30, 30),
          className: 'airplane-icon'
        })
      }

      if (planned_depairport && planned_destairport) {
        plan = `${planned_depairport} ⟶ ${planned_destairport}`;
      }

      return (
         <RotatedMarker
           position={coords}
           rotationAngle={parseInt(heading, 10)}
           rotationOrigin={'center'}
           key={`marker-${idx}`}
           icon={icon}
           onClick={() => {
             if (!isController) this.updateCallsign(callsign)
           }}
         >
          <Tooltip direction="auto">
            <React.Fragment>
              <div><strong>{callsign}</strong></div>
              <div>{name}</div>
              {!isController && (
                <React.Fragment>
                  <div>{planned_aircraft}</div>
                  <div>{altitude} FT.</div>
                  <div>{groundspeed} KTS</div>
                  <div>{heading}°</div>
                  <div>{plan}</div>
                </React.Fragment>
              )}
            </React.Fragment>
          </Tooltip>
        </RotatedMarker>
      )
    })
  }

  componentDidMount = () => {
    const { width, height } = this.getViewportSize()

    // for (let x = 0; x < CITIES.length; x++) {
    //   this.addFlight(CITIES[x].name, CITIES[x].coordinates[1], CITIES[x].coordinates[0])
    // }

    this.map = this.myRefs.current.leafletElement;

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
          this.getFlightData();
          window.dispatchEvent(new Event('resize'));
        }
      })
    }, 0);
  }

  render = () => {
    return (
      <div>
        <ToastContainer
          position="top-center"
          autoClose={5000}
          hideProgressBar={true}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          draggable />
        <Map
          ref={this.myRefs}
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
          disableClusteringAtZoom="6"
          showCoverageOnHover={false}
          maxClusterRadius="65"
        >
          {this.buildFlightMarkers()}
        </MarkerClusterGroup>
        <Control position="topleft">
          <div>
            <div>
              <button onClick={this.handleReset.bind(this)}>
                Reset View
              </button>
            </div>
            <div>
              <input
                type="text"
                name="flightSearch"
                placeholder="Search for the callsign..." />
              <input
                type="button"
                value="Search"
                onClick={this.searchFlight} />
            </div>
          </div>
        </Control>
        </Map>
      </div>
    )
  }
}
