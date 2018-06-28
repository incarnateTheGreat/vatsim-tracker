import React, { Component } from 'react'
import classNames from 'classnames'
import Metar from 'metar'
import { DEGREES_KEY } from '../constants/constants';

class ModalMetar extends Component {
	state = {
		isModalOpen: false,
    metar: null
	}

	closeModal = () => {
		this.setState({ isModalOpen: false })
	}

  getWindDirection = (deg) => {
    for (let x in DEGREES_KEY) {
      if (deg >= DEGREES_KEY[x][0] && deg <= DEGREES_KEY[x][1]) {
        // Return North based on two different ranges.
        if (x === 'N1' || x === 'N2') {
          return 'N'
        } else {
          return x;
        }
      }
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
        metar: Metar(nextProps.metar)
  		}
    }
	}

	render() {
		const modalClasses = classNames(
			'Modal',
			this.state.isModalOpen ? '--open' : ''
		)

    if (this.state.metar) {
      console.log(this.state.metar);
    }

		return (
			<div id='Modal_Metar' className={modalClasses}>
				<div className='Modal__container'>
					<header>
						<h1>{this.props.icao}</h1>
						<span
							onClick={this.closeModal.bind(this)}
							className='close'>X
						</span>
					</header>
					<div className='Modal__sections'>
						<section className='Modal__section'>
              {this.state.metar && (
                <table>
                  <tbody>
                    <tr>
                      <td>Temperature</td>
                      <td>{this.state.metar['temperature']} &#176;</td>
                    </tr>
                    <tr>
                      <td>Wind</td>
                      <td>
                        From the {this.getWindDirection(this.state.metar['wind']['direction'])}
                        at {this.state.metar['wind']['speed']}
                        {this.state.metar['wind']['unit']} &nbsp;
                      </td>
                    </tr>
                    <tr>
                      <td>Visibility</td>
                      <td>{this.state.metar['visibility']}SM</td>
                    </tr>
                    <tr>
                      <td>Clouds</td>
                      <td>
                        {this.state.metar['clouds'].map((metarData, i) =>
                          <ul>
                            {metarData['abbreviation'] === 'NCD' ?
                              <li>{metarData['meaning']}</li> :
                              <li key={i}>{metarData['meaning']} at {metarData['altitude']} FT.</li>}
                          </ul>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
						</section>
					</div>
				</div>
			</div>
		);
	}
}

export default ModalMetar;
