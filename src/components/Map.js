import React, { Component } from 'react';
import { isMobile } from 'react-device-detect';
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
import { CLIENT_LABELS, FLIGHT_DATA } from '../constants/constants';

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
    this.setState({
      zoom: this.state.zoom * 2,
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
      zoom: 8,
      center: flight.coordinates,
    })
  }

  handleReset() {
    console.log(this.state.center);
    this.setState({
      center: [0, 0],
      zoom: 1,
    })
  }

  componentDidMount() {
    let flightDataArr = [];

    for (let i = 0; i < FLIGHT_DATA.length; i++) {
      let clientInterface = {},
          clientDataSplit = FLIGHT_DATA[i].split(':');

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
        groundspeed: clientInterface.groundspeed
      })
    }

    this.setState({ flights: flightDataArr }, () => {
      console.log(this.state.flights);
    });
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
