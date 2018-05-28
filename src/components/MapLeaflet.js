import React, { Component } from 'react'
import {
  Map,
  TileLayer,
  Marker,
  Popup } from 'react-leaflet'
import { CITIES } from '../constants/constants'

export default class MapLeaflet extends Component {
  state = {
    lat: 43.862,
    lng: -79.369,
    zoom: 3,
    height: 1000,
    width: 500,
    markers: []
  }

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

  addMarker = (lat, lng) => {
    const { markers } = this.state
    markers.push([lat, lng])
    this.setState({ markers })
  }

  componentDidMount = () => {
    const { width, height } = this.getViewportSize()

    for (let x = 0; x < CITIES.length; x++) {
      this.addMarker(CITIES[x].coordinates[1], CITIES[x].coordinates[0])
    }

    setTimeout(() => {
      this.setState({ width, height }, () => {
        this.setResizeEvent();
        window.dispatchEvent(new Event('resize'));
      })
    }, 0);
  }

  render() {
    // const position = [this.state.lat, this.state.lng]

    return (
      <div id="mapid">
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
          {this.state.markers.map((position, idx) =>
            <Marker
              key={`marker-${idx}`}
              position={position}
            >
              <Popup>
                <span>eee</span>
              </Popup>
            </Marker>)
          }
        </Map>
      </div>
    )
  }
}
