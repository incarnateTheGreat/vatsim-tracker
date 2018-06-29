import React, { Component } from 'react'
import classNames from 'classnames'

class ModalIcao extends Component {
	state = {
		isModalOpen: false,
		items: null,
		icao: null
	}

	closeModal = () => {
		this.setState({ isModalOpen: false })
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
		const modal = document.getElementById('Modal_Icao')

    modal.addEventListener('click', (e) => {
      if (e.target.id === 'Modal_Icao') this.closeModal()
    })

		document.addEventListener('keydown', e => {
			if (e.key === 'Escape') this.closeModal()
		}, false);
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		return {
			items: nextProps.items,
			icao: nextProps.icao
		}
	}

	render() {
		const modalClasses = classNames(
			'Modal',
			this.state.isModalOpen ? '--open' : ''
		)

		return (
			<div id='Modal_Icao' className={modalClasses}>
				<div className='Modal__container'>
					<header>
						<h1>{this.state.icao}</h1>
						<span
							onClick={this.closeModal.bind(this)}
							className='close'>X
						</span>
					</header>
					<div className='Modal__sections'>
						<section className='Modal__section departures'>
							<h2>Departures</h2>
								{this.state.items[0] && (
									<ul>
										{this.state.items[0].length > 0 ? this.state.items[0].map((departureData, i) =>
											<li
												key={i}
												onClick={this.returnData.bind(this)}>
												<span className='Modal__link'>{departureData.callsign}</span>
											</li>
										) : (<li><span>None</span></li>)}
									</ul>
								)}
						</section>
						<section className='Modal__section arrivals'>
							<h2>Arrivals</h2>
								{this.state.items[1] && (
									<ul>
										{this.state.items[1].length > 0 ? this.state.items[1].map((arrivalData, i) =>
											<li
												key={i}
												onClick={this.returnData.bind(this)}>
												<span className='Modal__link'>{arrivalData.callsign}</span>
											</li>
										) : (<li><span>None</span></li>)}
									</ul>
								)}
						</section>
					</div>
				</div>
			</div>
		);
	}
}

export default ModalIcao;
