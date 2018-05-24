import React, { Component } from 'react';
import { isMobile } from 'react-device-detect';
import axios from 'axios';
import {
  ComposableMap,
  ZoomableGroup,
  Geographies,
  Geography,
  Markers,
  Marker
} from "react-simple-maps";
import { Motion, spring } from "react-motion";
import mapFile from '../maps/world-110m';
import { CLIENT_LABELS } from '../constants/constants';

// import { geoPath } from "d3-geo"

const wrapperStyles = {
  width: "100%",
  margin: "0 auto",
}

export default class Map extends Component {
  constructor() {
    super();

    this.state = {
      center: [0, 0],
      zoom: 1,
      flights: []
    };

    this.handleZoomIn = this.handleZoomIn.bind(this)
    this.handleZoomOut = this.handleZoomOut.bind(this)
    this.handleFlightClick = this.handleFlightClick.bind(this)
    this.handleReset = this.handleReset.bind(this)
  }

  handleZoomIn() {
    console.log(this.state);
    this.setState({
      // center: [174.33353257621044, -35.002372900345634],
      zoom: this.state.zoom * 2
    })
  }

  handleZoomOut() {
    if (this.state.zoom > 1) {
      this.setState({
        zoom: this.state.zoom / 2,
      })
    }
  }

  handleFlightClick(flight) {
    console.log(flight);

    this.setState({
      center: flight.coordinates,
      zoom: 8
    })
  }

  handleReset() {
    this.setState({
      center: [0, 0],
      zoom: 1
    })
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

        flightDataArr.push({
          name: clientInterface.realname,
          coordinates: [parseFloat(clientInterface.longitude), parseFloat(clientInterface.latitude)],
          frequency: clientInterface.frequency,
          altitude: clientInterface.altitude,
          planned_aircraft: clientInterface.planned_aircraft,
          heading: clientInterface.heading,
          groundspeed: clientInterface.groundspeed,
          planned_depairport: clientInterface.planned_depairport,
          planned_destairport: clientInterface.planned_destairport
        })
      }

      this.setState({ flights: flightDataArr });
    })
  }

  componentDidMount() {
    this.getFlightData();
  }

  // projection() {
  //   return geoTimes()
  //     .translate([this.props.width/2, this.props.height/2])
  //     .scale(160)
  // }

  thing(geo) {
    const geoArr = geo.geometry.coordinates[0],
          currentCoordinates = geoArr[0][geoArr.length - 1];
  }

  render() {
    return (
      <div style={wrapperStyles}>
        <button onClick={this.handleZoomIn}>
          { "Zoom in" }
        </button>
        <button onClick={this.handleZoomOut}>
          { "Zoom out" }
        </button>
        <button onClick={this.handleReset}>
          { "Reset" }
        </button>
        <Motion
          defaultStyle={{
            zoom: 1,
            x: 0,
            y: 20,
          }}
          style={{
            zoom: spring(this.state.zoom, {stiffness: 210, damping: 20}),
            x: spring(this.state.center[0], {stiffness: 210, damping: 20}),
            y: spring(this.state.center[1], {stiffness: 210, damping: 20}),
          }}
          >
          {({zoom,x,y}) => (
              <ComposableMap
                projectionConfig={{ scale: 205 }}
                width={980}
                height={551}
                style={{
                  width: "100%",
                  height: "auto",
                }}
                >
                <ZoomableGroup center={[x,y]} zoom={zoom}>
                  <Geographies geography={mapFile}>
                    {(geographies, projection) =>
                      geographies.map((geography, i) => (
                        <Geography
                          key={i}
                          geography={geography}
                          projection={projection}
                          disableoptimization="true"
                          onMouseMove={this.thing}
                          style={{
                            default: {
                              fill: "#ECEFF1",
                              stroke: "#607D8B",
                              strokeWidth: 0.75,
                              outline: "none",
                            },
                            hover: {
                              fill: "#ECEFF1",
                              stroke: "#607D8B",
                              strokeWidth: 0.75,
                              outline: "none",
                            },
                            pressed: {
                              fill: "#ECEFF1",
                              stroke: "#607D8B",
                              strokeWidth: 0.75,
                              outline: "none",
                            },
                          }}
                        />
                    ))}
                  </Geographies>
                  <Markers>
                    {this.state.flights.map((marker, i) => (
                      <Marker
                        key={i}
                        marker={marker}
                        onClick={this.handleFlightClick}
                        >
                        <circle
                          cx={0}
                          cy={0}
                          r={isMobile ? 16 : 6}
                          fill="#FF5722"
                          stroke="#DF3702"
                        />
                      </Marker>
                    ))}
                  </Markers>
                </ZoomableGroup>
              </ComposableMap>
            )}
        </Motion>
      </div>
    )
  }
}
