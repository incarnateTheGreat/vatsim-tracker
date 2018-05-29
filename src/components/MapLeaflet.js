import React, { Component } from 'react'
import axios from 'axios'
import {
  Map,
  TileLayer,
  Popup } from 'react-leaflet'
import Leaflet from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import Control from 'react-leaflet-control'
import RotatedMarker from 'react-leaflet-rotatedmarker'
import { CLIENT_LABELS,
         CITIES,
         MAX_BOUNDS } from '../constants/constants'

export default class MapLeaflet extends Component {
  state = {
    callsign: '',
    lat: 43.862,
    lng: -79.369,
    zoom: 2,
    height: 1000,
    width: 500,
    flights: []
  }

  interval = null;
  map = null;

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
			this.getFlightData();
		}, 60000);
	}

  handleReset = () => {
    this.setState({
      lat: 43.862,
      lng: -79.369,
      zoom: 3
    }, () => {
      // Clear Search Input.
      const flightSearchInput = document.getElementsByName('flightSearch')[0];
      flightSearchInput.value = '';
    })
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

  flightCallsignSearch = (e) => {
    this.setState({ callsign: e.target.value });
  }

  findFlight = () => {
    if (this.state.flights.length > 0) {
      const flight = this.state.flights.find(flight => {
        return flight.callsign.toUpperCase() === this.state.callsign.toUpperCase()
      })

      if (flight) this.handleFlightClick(flight);
    }
  }

  handleFlightClick = (flight, isCity) => {
    console.log(flight);

    if (isCity) {
      this.setState({
        center: flight.coordinates,
        zoom: this.state.zoom === 1 ? 50 : this.state.zoom
      })
    } else {
      this.setState({
        callsign: flight.callsign,
        lat: flight.coordinates[1],
        lng: flight.coordinates[0],
        zoom: 20
      }, () => {
        const { lat, lng } = this.state,
              map = this.map;

        // Programmatically open the Data Tooltip.
        this.map.eachLayer(layer => {
          if (layer._latlng && ((layer._latlng.lat === lat) && (layer._latlng.lng === lng))) {
            layer.openPopup();
          }
        });
      })
    }
  }

  checkFlightPosition = (clientInterface) => {
    return ((isNaN(clientInterface.longitude) || clientInterface.longitude === '') ||
            (isNaN(clientInterface.latitude) || clientInterface.latitude === ''));
  }

  async getData() {
    return await axios('http://localhost:8000/api/vatsim-data')
      .then(res => res.data);
  }

  getFlightData = () => {
    let flightDataArr = [];

    this.getData().then(data => {
      for (let i = 0; i < data.length; i++) {
        let clientInterface = {},
            clientDataSplit = data[i].split(':');

        for (let j = 0; j < CLIENT_LABELS.length; j++) {
          clientInterface[CLIENT_LABELS[j]] = clientDataSplit[j];
        }

        if (!this.checkFlightPosition(clientInterface)) {
          flightDataArr.push({
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
            planned_destairport: clientInterface.planned_destairport
          })
        }
      }

      this.setState({ flights: flightDataArr });
    })
  }

  addFlight = (name, lat, lng) => {
    const { flights } = this.state

    flights.push({ name: name, coordinates: [lat, lng] })

    this.setState({ flights })
  }

  buildFlightMarkers = () => {
    return this.state.flights.map((position, idx) => {
      const { name,
              callsign,
              altitude,
              heading,
              groundspeed,
              planned_depairport,
              planned_destairport,
              planned_aircraft } = position,
              coords = [position.coordinates[1], position.coordinates[0]]

        const icon = new Leaflet.Icon({
          iconUrl: require('../images/airplane-icon.png'),
          iconAnchor: null,
          shadowUrl: null,
          shadowSize: null,
          shadowAnchor: null,
          iconSize: new Leaflet.Point(30, 30),
          className: 'airplane-icon'
        })

        let plan = false;

      if (planned_depairport && planned_destairport) {
        plan = `${planned_depairport} ⟶ ${planned_destairport}`;
      }

      return (
         <RotatedMarker
           position={coords}
           rotationAngle={parseInt(heading)}
           rotationOrigin={'center'}
           key={`marker-${idx}`}
           icon={icon}
         >
          <Popup>
            <div>
              <div><strong>{callsign}</strong></div>
              <div>{name}</div>
              <div>{planned_aircraft}</div>
              <div>{altitude} FT.</div>
              <div>{groundspeed} KTS</div>
              <div>{heading}°</div>
              <div>{plan}</div>
            </div>
          </Popup>
        </RotatedMarker>
      )
    })
  }

  componentDidMount = () => {
    const { width, height } = this.getViewportSize()

    // for (let x = 0; x < CITIES.length; x++) {
    //   this.addFlight(CITIES[x].name, CITIES[x].coordinates[1], CITIES[x].coordinates[0])
    // }

    this.map = this.refs.map.leafletElement;

    setTimeout(() => {
      this.setState({ width, height }, () => {
        if (!this.interval) {
          this.setResizeEvent();
          this.getFlightData();
          this.startInterval();
          window.dispatchEvent(new Event('resize'));
        }
      })
    }, 0);
  }

  render = () => {
    return (
      <div>
        <Map
          ref='map'
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
          showCoverageOnHover={false}
          maxClusterRadius="40"
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
                placeholder="Search for the callsign..."
                onChange={this.flightCallsignSearch} />
              <input
                type="button"
                value="Search"
                onClick={this.findFlight} />
            </div>
          </div>
        </Control>
        </Map>
      </div>
    )
  }
}
