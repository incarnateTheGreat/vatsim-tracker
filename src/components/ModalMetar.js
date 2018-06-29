import React, { Component } from 'react'
import classNames from 'classnames'
import Metar from 'metar'
import { DEGREES_KEY } from '../constants/constants';

class ModalMetar extends Component {
	state = {
    icao: null,
		isModalOpen: false,
    metar: null
	}

	closeModal = () => {
		this.setState({ isModalOpen: false })
	}

  convertSMtoKM = (sm) => {
    return Math.round(1.609344 * sm) + ' KM'
  }

  getWeather = () => {
    const weather = this.state.metar['weather'],
          clouds = this.state.metar['clouds']

    if (weather) {
      return this.getWeatherIcon(weather[weather.length - 1])
    } else if (this.state.metar['clouds']) {
      return this.getWeatherIcon(clouds[0])
    } else {
      return ''
    }
  }

  getWeatherIcon = (icon) => {
    switch (icon.meaning) {
			case 'clear-night':
				return 'wi-night-clear';
      case 'few':
        return 'wi-day-cloudy'
      case 'scattered':
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
        return null;
    }
  }

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

  getVisibility = (visibility) => {
    if (visibility === 9999) {
      return 9999
    } else {
      return `${visibility} SM (${this.convertSMtoKM(visibility)})`
    }
  }

	toggleModal = () => {
		this.setState({ isModalOpen: (this.state.isModalOpen ? false : true) })
	}

	returnData = (e) => {
		const value = e.target.innerHTML || e.target.innerText
		this.closeModal()
		this.props.returnData(value)
	}

	componentDidMount = () => {
		const modal = document.getElementById('Modal_Metar')

    modal.addEventListener('click', (e) => {
      if (e.target.id === 'Modal_Metar') this.closeModal()
    })

		document.addEventListener('keydown', e => {
			if (e.key === 'Escape') this.closeModal()
		}, false);
	}

	static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.metar) {
      return {
        icao: nextProps.icao.toUpperCase(),
        metar: Metar(nextProps.metar)
  		}
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

      console.log(this.state.metar);
    }

		return (
			<div id='Modal_Metar' className={modalClasses}>
				<div className='Modal__container'>
					<header>
						<h1>{this.state.icao}</h1>
						<span
							onClick={this.closeModal.bind(this)}
							className='close'>X
						</span>
					</header>
					<div className='Modal__sections'>
						<section className='Modal__section weather'>
              {this.state.metar && (
                <React.Fragment>
                  <div className='Modal__weatherIcon'>
                    <i className={weatherClasses}></i>
                  </div>
                  <div className='Modal__weatherContainer'>
                    <div>Temperature</div>
                    <div>{this.state.metar['temperature']}&#176;</div>
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
                      <ul>
                        {this.state.metar['clouds'] && this.state.metar['clouds'].map((metarData, i) =>
                          metarData['abbreviation'] === 'NCD' ?
                            <li key={i}>{metarData['meaning']}</li> :
                            <li key={i}>{metarData['meaning']} at {metarData['altitude']} FT.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  <div className='Modal__weatherContainer'>
                    <div>Weather</div>
                    <div>
                      <ul>
                        {this.state.metar['weather'] ? this.state.metar['weather'].map((weatherData, i) =>
                          <li key={i}>{weatherData['meaning']}</li>
                        ) : (<span>Currently unavailable.</span>)}
                      </ul>
                    </div>
                  </div>
                </React.Fragment>
              )}
						</section>
					</div>
				</div>
			</div>
		);
	}
}

export default ModalMetar;
