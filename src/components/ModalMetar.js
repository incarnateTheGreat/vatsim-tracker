import React, { Component, Fragment } from 'react'
import classNames from 'classnames'
import Metar from 'metar'
import { DEGREES_KEY, CURRENTLY_UNAVAILABLE } from '../constants/constants';

class ModalMetar extends Component {
	state = {
		airport_name: null,
    icao: null,
		isModalOpen: false,
    metar: null
  }
  
	closeModal = () => {
		this.setState({ isModalOpen: false })
  }
  
  // Convert Statue Miles to Kilmetres.
  convertSMtoKM = sm => {
    const conversion = Math.round(1.609344 * sm)

    return `${conversion} KM`
  }
  
  // If the User wants to go to the currently-selected Airport on the Map, send back the data to the Container and pan to it.
  gotoAirport = () => {
    this.closeModal()
    return this.props.returnICAO(this.state.icao)
  }

  // Determine the correct Atmospheric Pressure for the geographic area: 
  // hPa (Europe and most of the world), or Hg (North America)
  getQNH = () => {
    const keys = Object.keys(this.state.metar)
    const altimeter = keys.find(key => key.includes('altimeterIn'))

    let altimeterType = null

    if (altimeter) {
      altimeterType = altimeter.includes('Hpa') ? 'hPa' : 'Hg'
      return `${this.state.metar[altimeter]} ${altimeterType}` || 'unavailable'
    } else {
      return CURRENTLY_UNAVAILABLE
    }
  }

  // Get and Display the Temperature.
  getTemperature = (temperature) => {
    return temperature ? `${temperature}${String.fromCodePoint(176)}` : CURRENTLY_UNAVAILABLE
  }

  // Get and Display the Weather Icon.
  getWeather = () => {
    const weather = this.state.metar['weather']
    const clouds = this.state.metar['clouds']

    if (weather) {
      return this.getWeatherIcon(weather[weather.length - 1].meaning)
    } else if (clouds) {
      if (clouds[0].abbreviation === 'NCD') {
        return this.getWeatherIcon('clear-day')
      } else {
        return this.getWeatherIcon(clouds[0].meaning)
      }
    } else {
      return this.getWeatherIcon()
    }
  }

  getWeatherIcon = icon => {
    switch (icon) {
			case 'clear-night':
				return 'wi-night-clear';
      case 'few':
        return 'wi-day-cloudy'
      case 'scattered':
      case 'broken':
        return 'wi-day-sunny-overcast'
			case 'cloudy':
				return 'wi-cloudy';
			case 'fog':
				return 'wi-fog';
			case 'rain':
				return 'wi-rain';
			case 'wind':
				return 'wi-day-windy';
			case 'snow':
				return 'wi-snow';
      case 'clear-day':
        return 'wi-day-sunny'
      case 'partly-cloudy-night':
        return 'wi-night-partly-cloudy'
      default:
        return 'wi-na';
    }
  }

  // Use the Degrees Key to approximate the Range of what direction the Wind is currently blowing.
  getWindDirection = (deg) => {
    for (let x in DEGREES_KEY) {
      if (deg >= DEGREES_KEY[x][0] && deg <= DEGREES_KEY[x][1]) {
        // Return North based on two different ranges.
        if (x === 'N1' || x === 'N2') {
          return 'North'
        } else {
          return x;
        }
      }
    }
  }

  // Determine the Visibility based on the data available. Otherwise, show as 'Unavailable'.
  getVisibility = visibility => {
    if (visibility === 9999) {
      return 9999
    } else if (!visibility) {
      return 'Unavailable'
    } else {
      return `${visibility} SM (${this.convertSMtoKM(visibility)})`
    }
  }

	toggleModal = () => {
		this.setState({ isModalOpen: (this.state.isModalOpen ? false : true) })
	}
  
  // Create click and key events to support closing the modal.
	componentDidMount = () => {
		const modal = document.getElementById('Modal_Metar')

    modal.addEventListener('click', (e) => {
      if (e.target.id === 'Modal_Metar') this.closeModal()
    })

		document.addEventListener('keydown', e => {
			if (e.key === 'Escape') this.closeModal()
		}, false);
  }
  
	static getDerivedStateFromProps(nextProps) {
    if (nextProps.metar && nextProps.icao) {
      return {
				airport_name: nextProps.airport_name,
        icao: nextProps.icao.toUpperCase(),
        metar: Metar(nextProps.metar)
  		}
    } else {
      return null
    }
	}

	render() {
		const modalClasses = classNames(
			'Modal',
			this.state.isModalOpen ? '--open' : ''
		);

    let weatherClasses = ''

    if (this.state.metar) {
      weatherClasses = classNames(
        'wi',
        this.getWeather()
      )
    }

		return (
			<div id='Modal_Metar' className={modalClasses}>
				<div className='Modal__container --weather'>
					<header>
            <div>
              <h1>{this.state.icao} ({this.state.airport_name})</h1>
              <h5
                className='Modal__gotoAirport'
                onClick={() => this.gotoAirport()}>Go to Airport
              </h5>
            </div>
						<span
							onClick={this.closeModal.bind(this)}
							className='close'>X
						</span>
					</header>
					<div className='Modal__sections --weather'>
						<section className='Modal__section --weather'>
              {this.state.metar && (
                <Fragment>
                  <div className='Modal__weatherIcon'>
                    <i className={weatherClasses}></i>
                  </div>
                  <div className='Modal__weatherData'>
                    <div className='Modal__weatherContainer'>
                      <div>Temperature</div>
                      <div>{this.getTemperature(this.state.metar['temperature'])}</div>
                    </div>
                    <div className='Modal__weatherContainer'>
                      <div>Wind</div>
                      <div>
                        From the {this.getWindDirection(this.state.metar['wind']['direction'])} at {this.state.metar['wind']['speed']} {this.state.metar['wind']['unit']}
                      </div>
                    </div>
                    <div className='Modal__weatherContainer'>
                      <div>Visibility</div>
                      <div>{this.getVisibility(this.state.metar['visibility'])}</div>
                    </div>
                    <div className='Modal__weatherContainer'>
                      <div>Clouds</div>
                      <div>
                        <ul className='Modal__weatherContainer__list'>
                          {this.state.metar['clouds'] ? this.state.metar['clouds'].map((metarData, i) =>
                            metarData['abbreviation'] === 'NCD' ?
                              <li key={i}>{metarData['meaning']}</li> :
                              <li key={i}>{metarData['meaning']} at {metarData['altitude']} FT.</li>
                          ) : (<li>{CURRENTLY_UNAVAILABLE}</li>)}
                        </ul>
                      </div>
                    </div>
                    <div className='Modal__weatherContainer'>
                      <div>QNH</div>
                      <div>{this.getQNH()}</div>
                    </div>
                    <div className='Modal__weatherContainer'>
                      <div>Weather</div>
                      <div>
                        <ul className='Modal__weatherContainer__list'>
                          {this.state.metar['weather'] ? this.state.metar['weather'].map((weatherData, i) =>
                            <li key={i}>{weatherData['meaning']}</li>
                          ) : (<span>Nothing to report.</span>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                </Fragment>
              )}
						</section>
					</div>
				</div>
			</div>
		);
	}
}

export default ModalMetar;
