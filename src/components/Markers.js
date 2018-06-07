import React, { Component } from 'react';
import Leaflet from 'leaflet'
import RotatedMarker from 'react-leaflet-rotatedmarker'
import { Tooltip } from 'react-leaflet'

export class Markers extends Component {
  render() {
		const { flights, selected_flight, updateCallsign } = this.props;

    return (
			flights.map((position, idx) => {
	      const { altitude,
								callsign,
								frequency,
								groundspeed,
								isController,
								name,
								heading,
								planned_aircraft,
								planned_depairport,
								planned_destairport } = position,
								coords = [position.coordinates[1], position.coordinates[0]]

	      let icon = null,
						plan = false;

	      if (isController) {
	        icon = new Leaflet.Icon({
						className: 'controller-icon',
						iconAnchor: null,
						iconSize: new Leaflet.Point(30, 30),
	          iconUrl: require('../images/controller-icon.png'),
						shadowUrl: null,
						shadowAnchor: null,
						shadowSize: null
	        })
	      } else {
	        icon = new Leaflet.Icon({
						className: 'airplane-icon',
						iconAnchor: null,
						iconSize: new Leaflet.Point(30, 30),
						iconUrl: require('../images/airplane-icon.png'),
						shadowUrl: null,
						shadowAnchor: null,
						shadowSize: null
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
								{isController && (
									<div>{frequency}</div>
								)}
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
