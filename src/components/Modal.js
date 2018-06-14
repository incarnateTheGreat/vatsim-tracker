import React, { Component } from 'react'
import classNames from 'classnames'

class Modal extends Component {
	state = {
		isModalOpen: false
	}

	closeModal = () => {
		this.setState({ isModalOpen: false })
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

	render() {
		const modalClasses = classNames(
			'Modal',
			this.state.isModalOpen ? '--open' : ''
		)

		return (
			<div id='Modal' className={modalClasses}>
				<div className='Modal__container'>
					<header>
						<h1>(Airport ICAO)</h1>
						<span
							onClick={this.closeModal.bind(this)}
							className='close'>X
						</span>
					</header>
					<div className='Modal__sections'>
						<section className='Modal__section'>
							<h2>Departures</h2>
							<ul>
								<li>(departure)</li>
								<li>(departure)</li>
								<li>(departure)</li>
								<li>(departure)</li>
								<li>(departure)</li>
								<li>(departure)</li>
								<li>(departure)</li>
							</ul>
						</section>
						<section className='Modal__section'>
							<h2>Arrivals</h2>
							<ul>
								<li>(arrival)</li>
								<li>(arrival)</li>
								<li>(arrival)</li>
								<li>(arrival)</li>
								<li>(arrival)</li>
								<li>(arrival)</li>
								<li>(arrival)</li>
							</ul>
						</section>
					</div>
				</div>
			</div>
		);
	}
}

export default Modal;
