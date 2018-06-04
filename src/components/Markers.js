import React, { Component } from 'react';
import Leaflet from 'leaflet'
import RotatedMarker from 'react-leaflet-rotatedmarker'
import { Tooltip } from 'react-leaflet'

export class Markers extends Component {
  render() {
		const { flights, updateCallsign } = this.props;

    return (
			flights.map((position, idx) => {
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
	             if (!isController) updateCallsign(callsign)
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
    );
  }
}
