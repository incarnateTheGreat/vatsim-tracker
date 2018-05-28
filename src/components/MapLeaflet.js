import React, { Component } from 'react'
import axios from 'axios'
import {
  Map,
  TileLayer,
  Marker,
  Popup } from 'react-leaflet'
import { CLIENT_LABELS, CITIES } from '../constants/constants'

export default class MapLeaflet extends Component {
  state = {
    lat: 43.862,
    lng: -79.369,
    zoom: 3,
    height: 1000,
    width: 500,
    flights: []
  }

  interval = null;

  getViewportSize() {
    const width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
          height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    return { width, height }
  }

  setResizeEvent() {
    window.addEventListener('resize', () => {
      setTimeout(() => {
        const { width, height } = this.getViewportSize()

        this.setState({ width, height })
      }, 500);
    })
  }

  startInterval() {
		this.interval = setInterval(() => {
			this.getFlightData();
		}, 60000);
	}

  checkFlightPosition(clientInterface) {
    return ((isNaN(clientInterface.longitude) || clientInterface.longitude === '') ||
            (isNaN(clientInterface.latitude) || clientInterface.latitude === ''));
  }

  async getData() {
    return await axios('http://localhost:8000/api/vatsim-data')
      .then(res => res.data);
  }

  getFlightData() {
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
    this.setState({ flights }, () => {
      console.log(this.state);
    })
  }

  componentDidMount = () => {
    const { width, height } = this.getViewportSize()

    // for (let x = 0; x < CITIES.length; x++) {
    //   this.addFlight(CITIES[x].name, CITIES[x].coordinates[1], CITIES[x].coordinates[0])
    // }

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

  render() {
    return (
      <div>
        <Map
          center={[this.state.lat, this.state.lng]}
          zoom={this.state.zoom}
          style={{
            height: this.state.height,
            width: this.state.width
          }}>
          <TileLayer
            attribution="&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        {this.state.flights.map((position, idx) => {
          const { name,
                  callsign,
                  altitude,
                  heading,
                  groundspeed,
                  transponder,
                  planned_depairport,
                  planned_destairport,
                  planned_aircraft } = position

          const coords = [position.coordinates[1], position.coordinates[0]]

          return (
            <Marker
              key={`marker-${idx}`}
              position={coords}
            >
              <Popup>
                <div>
                  <div><strong>{callsign}</strong></div>
                  <div>{name}</div>
                  <div>{planned_aircraft}</div>
                  <div>{altitude} FT.</div>
                  <div>{groundspeed} KTS</div>
                  <div>{transponder}</div>
                  <div>{planned_depairport} -> {planned_destairport}</div>
                </div>
              </Popup>
            </Marker>
          )
        })
        }
        </Map>
      </div>
    )
  }
}
