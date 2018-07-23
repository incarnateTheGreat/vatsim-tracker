import React, { Component } from 'react';
import Leaflet from 'leaflet'
import RotatedMarker from 'react-leaflet-rotatedmarker'
import { Tooltip } from 'react-leaflet'

export class Markers extends Component {
  state = {
    callsign: null
  }

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

  getTypeOfAircraftSelected = (aircraft) => {
    if (aircraft.includes('B74')) {
      return require('../images/airplane-747-icon-selected.png')
    } else if (aircraft.includes('B73') ||
               aircraft.includes('B77') ||
               aircraft.includes('B78') ||
               aircraft.includes('78') ||
               aircraft.includes('A31') ||
               aircraft.includes('A32') ||
               aircraft.includes('A33')) {
      // return 'Boeing or Airbus'
      return require('../images/airplane-737-777-icon-selected.png')
    } else if (aircraft.includes('DH')) {
      // return 'Dash'
      return require('../images/airplane-prop-icon-selected.png')
    } else if (aircraft.includes('C130')) {
      // return 'Hercules'
      return require('../images/airplane-icon-selected.png')
    } else if (aircraft.includes('C172')) {
      // return 'Cessena'
      return require('../images/airplane-icon-selected.png')
    } else {
      // return 'Default'
      return require('../images/airplane-icon-selected.png')
    }
  }

  removeSelected = (planned_aircraft) => {
    return new Leaflet.Icon({
      iconUrl: this.getTypeOfAircraft(planned_aircraft),
      className: 'airplane-icon'
    })
  }

  selectFlight = (planned_aircraft) => {
    return new Leaflet.Icon({
      iconUrl: this.getTypeOfAircraftSelected(planned_aircraft),
      className: 'airplane-icon--selected'
    })
  }

  setSelected = (planned_aircraft, callsign) => {
    if (this.state.callsign) {
      return this.selectFlight(planned_aircraft)
    } else {
      this.setState({ callsign })
      return this.selectFlight(planned_aircraft)
    }
  }

  static getDerivedStateFromProps(nextProps, prevState) {
		return {
			callsign: nextProps.selectedFlight ? nextProps.selectedFlight.callsign : null
		}
	}

  render = () => {
		const { flights,
            selectedFlight,
            updateCallsign } = this.props;

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
						plan = false

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
	      } else if (this.state.callsign === callsign) {
          icon = new Leaflet.Icon({
						className: 'airplane-icon--selected',
						iconAnchor: null,
						iconSize: new Leaflet.Point(30, 30),
						iconUrl: this.getTypeOfAircraftSelected(planned_aircraft),
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

        // If the user has submitted a flight plan, display the Departure and Destination points.
	      if (planned_depairport && planned_destairport) {
	        plan = `${planned_depairport} ⟶ ${planned_destairport}`
	      }

	      return (
	         <RotatedMarker
             icon={icon}
             key={`marker-${idx}`}
             onClick={e => {
               if (!isController) {
                 e.sourceTarget.setIcon(this.setSelected(planned_aircraft, callsign))
                 updateCallsign(callsign)
               }}
             }
             onMouseOver={e => {
               if (!isController) {
                 e.sourceTarget.setIcon(this.setSelected(planned_aircraft, callsign))
               }}
             }
             onMouseOut={e => {
               if (!isController) {
                 e.sourceTarget.setIcon(this.removeSelected(planned_aircraft, callsign))
               }}
             }
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
