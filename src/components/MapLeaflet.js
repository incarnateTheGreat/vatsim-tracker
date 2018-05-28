import React, { Component } from 'react'
import {
  Map,
  TileLayer,
  Marker,
  Popup } from 'react-leaflet'

export default class MapLeaflet extends Component {
  state = {
    lat: 51.505,
    lng: -0.09,
    zoom: 5,
    height: 0,
    width: 0
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

        this.setState({ width, height }, () => {
          console.log(this.state.width, this.state.height);
        })
      }, 500);
    })
  }

  componentDidMount = () => {
    const { width, height } = this.getViewportSize()

    this.setState({ width, height }, () => {
      this.setResizeEvent();
    })
  }

  render() {
    const position = [this.state.lat, this.state.lng]

    return (
      <div id="mapid" style={{
         height: this.state.height,
         width: this.state.width
       }}>
        <Map center={position}
             zoom={this.state.zoom}
             style={{
                height: this.state.height,
                width: this.state.width
              }}>
          <TileLayer
            attribution="&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            <Popup>
              A pretty CSS3 popup. <br /> Easily customizable.
            </Popup>
          </Marker>
        </Map>
      </div>
    )
  }
}
