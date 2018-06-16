import React, { Component } from 'react'
import classNames from 'classnames'

class Modal extends Component {
	state = {
		isModalOpen: false,
		items: null,
		icao: null
	}

	closeModal = () => {
		this.setState({ isModalOpen: false })
	}

	returnData = (e) => {
		const value = e.target.innerHTML || e.target.innerText
		this.closeModal()
		this.props.returnData(value)
	}

	toggleModal = () => {
		this.setState({ isModalOpen: (this.state.isModalOpen ? false : true) })
	}

	componentDidMount = () => {
		const modal = document.getElementById('Modal')

		window.onclick = (e) => {
			if (e.target === modal) this.closeModal()
		}
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
			<div id='Modal' className={modalClasses}>
				<div className='Modal__container'>
					<header>
						<h1>{this.state.icao}</h1>
						<span
							onClick={this.closeModal.bind(this)}
							className='close'>X
						</span>
					</header>
					<div className='Modal__sections'>
						<section className='Modal__section'>
							<h2>Departures</h2>
								{this.state.items[0] && (
									<ul>
										{this.state.items[0].map((obj, i) =>
											<li
												key={i}
												onClick={this.returnData.bind(this)}>
												<span className='Modal__link'>{obj.callsign}</span>
											</li>
										)}
									</ul>
								)}
						</section>
						<section className='Modal__section'>
							<h2>Arrivals</h2>
								{this.state.items[1] && (
									<ul>
										{this.state.items[1].map((obj, i) =>
											<li
												key={i}
												onClick={this.returnData.bind(this)}>
												<span className='Modal__link'>{obj.callsign}</span>
											</li>
										)}
									</ul>
								)}
						</section>
					</div>
				</div>
			</div>
		);
	}
}

export default Modal;
