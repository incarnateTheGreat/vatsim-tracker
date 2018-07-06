import React, { Component } from 'react';
import Leaflet from 'leaflet'
import RotatedMarker from 'react-leaflet-rotatedmarker'
import { Tooltip } from 'react-leaflet'

export class Markers extends Component {
  getTypeOfAircraft = (aircraft) => {
    if (aircraft.includes('B74')) {
      return require('../images/airplane-747-icon.png')
    } else if (aircraft.includes('B73') ||
               aircraft.includes('B77') ||
               aircraft.includes('B78') ||
               aircraft.includes('78') ||
               aircraft.includes('A31') ||
               aircraft.includes('A32') ||
               aircraft.includes('A33')) {
      // return 'Boeing or Airbus'
      return require('../images/airplane-737-777-icon.png')
    } else if (aircraft.includes('DH')) {
      // return 'Dash'
      return require('../images/airplane-prop-icon.png')
    } else if (aircraft.includes('C130')) {
      // return 'Hercules'
      return require('../images/airplane-icon.png')
    } else if (aircraft.includes('C172')) {
      // return 'Cessena'
      return require('../images/airplane-icon.png')
    } else {
      // return 'Default'
      return require('../images/airplane-icon.png')
    }
  }

  render() {
		const { flights, updateCallsign } = this.props;

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
						iconUrl: this.getTypeOfAircraft(planned_aircraft),
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
             icon={icon}
             key={`marker-${idx}`}
             onClick={() => { if (!isController) updateCallsign(callsign)} }
	           position={coords}
	           rotationAngle={parseInt(heading, 10)}
	           rotationOrigin={'center'}
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
