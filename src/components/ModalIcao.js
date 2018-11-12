import React, { Component } from 'react'
import classNames from 'classnames'

class ModalIcao extends Component {
	state = {
		airport_name: null,
		arrivals_sort: null,
		departures_sort: null,
		isModalOpen: false,
		items: null,
		icao: null
	}

	closeModal = () => {
		this.setState({ 
			arrivals_sort: null,
			departures_sort: null,
			isModalOpen: false 
		}, () => {
			this.clearArrows()
		})
	}

	clearArrows = () => {
		// Get Parent of Departures or Arrivals' Element.
		const columnElems  = document.getElementsByClassName('table__columnHeader')

		// Find and Remove Arrow.
		for (let i = 0; i < columnElems.length; i++) {
			if (columnElems[i].children.length > 0) columnElems[i].removeChild(columnElems[i].children[0])
		}
	}

  gotoAirport = () => {
		this.closeModal()

    return this.props.returnICAO(this.state.icao)
	}
	
	sortColumn = (group, col, sortOrder, e) => {
		const copiedItems = JSON.parse(JSON.stringify(this.state.items)),
					elem = e.currentTarget,
					upArrow = '&#9650',
					downArrow = '&#9660'

		// Change Order of Sort Direction.
		if (!sortOrder || sortOrder === 'ASC') {
			sortOrder = 'DESC';
		} else if (sortOrder === 'DESC') {
			sortOrder = 'ASC';
		}

		// Sort based on Sort Order and Data.
		const sortedResult = copiedItems[group].sort((a,b) => {
			const nameA = a[col].toUpperCase(),
						nameB = b[col].toUpperCase()

			if (sortOrder === 'ASC') {
				return nameA.localeCompare(nameB)
			} else if (sortOrder === 'DESC') {
				return nameB.localeCompare(nameA)
			}
		})
		
		// Re-insert data back into Items object.
		let items = this.state.items;
		items[group] = sortedResult;

		this.clearArrows()

		// Place Arrow in Clicked Column with updated direction.
		const arrowElem = `<span class='table__sortArrow'>${sortOrder === 'ASC' ? upArrow : downArrow}</span>`
		elem.insertAdjacentHTML('beforeend', arrowElem)		

		this.setState({ 
			items,
			arrivals_sort: group === 1 ? sortOrder : this.state.arrivals_sort,
			departures_sort: group === 0 ? sortOrder : this.state.departures_sort
		})
	}

	toggleModal = () => {
		this.setState({ 
			isModalOpen: this.state.isModalOpen ? false : true
		}, () => {
			// Get Parents of Departures and Arrivals' Element.
			const columnElems_departures = document.getElementsByClassName('departures')[0].getElementsByClassName('table__columnHeader')[0],
						columnElems_arrivals = document.getElementsByClassName('arrivals')[0].getElementsByClassName('table__columnHeader')[0]

			// Assign first column of each section an ASC Arrow.
			if (columnElems_departures !== undefined || columnElems_arrivals !== undefined) {
				const arrowElem = `<span class='table__sortArrow'>&#9650</span>`				
				columnElems_departures.insertAdjacentHTML('beforeend', arrowElem)		
			}
		})
	}

	returnData = callsign => {
		this.closeModal()
		this.props.returnData(callsign)
	}

	componentDidMount = () => {
		const modal = document.getElementById('Modal_Icao')

    modal.addEventListener('click', e => {
      if (e.target.id === 'Modal_Icao') this.closeModal()
    })

		document.addEventListener('keydown', e => {
			if (e.key === 'Escape') this.closeModal()
		}, false);		
	}

  componentDidUpdate = () => {
    const tables = document.getElementsByClassName("Modal__section")

    if (tables.length > 0) {
      for (let i = 0; i < tables.length; i++) tables[i].scrollTop = 0
		}
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		return {
			airport_name: nextProps.airport_name,
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
					<div className='Modal__sections'>
						<section className='Modal__section --departures'>
							<h2>Departures {this.state.items[0] && this.state.items[0].length > 0 ? `(${this.state.items[0].length})` : ``}</h2>
                {this.state.items[0] && (
                  <div className='table'>
                    <div className='table__header table__row departures'>
											<div className='table__data table__columnHeader' 
												   onClick={elem => this.sortColumn(0, 'callsign', this.state.departures_sort, elem)}>Callsign</div>
											<div className='table__data table__columnHeader'
													 onClick={elem => this.sortColumn(0, 'name', this.state.departures_sort, elem)}>Pilot's Name</div>
											<div className='table__data table__columnHeader'
													 onClick={elem => this.sortColumn(0, 'planned_destairport', this.state.departures_sort, elem)}>Arr. Location</div>
                    </div>
                    {this.state.items[1].length > 0 ? this.state.items[0].map((departureData, i) =>
                      <div className='table__row Modal__link'
													 data-icao={departureData.callsign}
													 onClick={() => this.returnData(departureData.callsign)}
													 key={i}>
                        <span className='table__data'>{departureData.callsign}</span>
                        <span className='table__data'>{departureData.name}</span>
                        <span className='table__data'>{departureData.planned_destairport}</span>
                      </div>
                    ) : (<div><span>None</span></div>)}
                  </div>
                )}
						</section>
						<section className='Modal__section --arrivals'>
							<h2>Arrivals {this.state.items[1] && this.state.items[1].length > 0 ? `(${this.state.items[1].length})` : ``}</h2>
								{this.state.items[1] && (
									<div className='table'>
                    <div className='table__header table__row arrivals'>
											<div className='table__data table__columnHeader'
													 onClick={elem => this.sortColumn(1, 'callsign', this.state.arrivals_sort, elem)}>Callsign</div>
											<div className='table__data table__columnHeader'
													 onClick={elem => this.sortColumn(1, 'name', this.state.arrivals_sort, elem)}>Pilot's Name</div>
											<div className='table__data table__columnHeader'
													 onClick={elem => this.sortColumn(1, 'planned_depairport', this.state.arrivals_sort, elem)}>Dep. Location</div>
                    </div>
										{this.state.items[1].length > 0 ? this.state.items[1].map((arrivalData, i) =>
											<div className='table__row Modal__link'
													 data-icao={arrivalData.callsign}
													 onClick={() => this.returnData(arrivalData.callsign)}
													 key={i}>
                        <span className='table__data'>{arrivalData.callsign}</span>
                        <span className='table__data'>{arrivalData.name}</span>
                        <span className='table__data'>{arrivalData.planned_depairport}</span>
											</div>
										) : (<div><span>None</span></div>)}
									</div>
								)}
						</section>
					</div>
          <div className='Modal__sections'>
            <section className='Modal__section --atc'>
							<h2>Controllers</h2>
								{this.state.items[2] && (
									<ul className='icao__list'>
										{this.state.items[2].length > 0 ? this.state.items[2].map((controllerData, i) =>
											<li className='icao__list__child' key={i}>
                        <ul>
                          <li><span>{controllerData.name}</span></li>
                          <li><span>{controllerData.callsign}</span></li>
                          <li><span>{controllerData.frequency}</span></li>
                        </ul>
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
