import React, { Component } from 'react'
import classNames from 'classnames'
import { DOWN_ARROW, UP_ARROW } from '../constants/constants'

function sortColumnData(icaoColumnData, group, col, sortOrder) {
	return icaoColumnData[group].sort((a,b) => {
		const nameA = a[col].toUpperCase(),
					nameB = b[col].toUpperCase()

		if (sortOrder === 'ASC') {
			return nameA.localeCompare(nameB, undefined, {numeric: true})
		} else if (sortOrder === 'DESC') {
			return nameB.localeCompare(nameA, undefined, {numeric: true})
		}

		return 0
	})
}

class ModalIcao extends Component {
	state = {
		airport_name: null,
		arrivals_sort_column: 'callsign',
    arrivals_sort_order: null,
    controllers: null,
		departures_sort_order: null,
		departures_sort_column: 'callsign',
		isModalOpen: false,
		items: null,
		icao: null
  }
  
  // Nullify all data when closing the Modal.
	closeModal = () => {
		this.setState({ 
			arrivals_sort_order: null,
			departures_sort_order: null,
			isModalOpen: false 
		}, () => {
			this.clearArrows()
		})
  }
  
  // Clear any Arrows off the screen to allow to be reset.
	clearArrows = (group) => {
		let columnElems = null

		// If 'group' is not specified, reset both sets of columns. Otherwise, select either Departures or Arrivals to clear.
		if (!group) {
			columnElems = document.getElementsByClassName('table__columnHeader')
		} else {
			if (group === 1) {
				columnElems = document.getElementsByClassName('arrivals')[0].getElementsByClassName('table__columnHeader')
			} else if (group === 0) {
				columnElems = document.getElementsByClassName('departures')[0].getElementsByClassName('table__columnHeader')
			}
		}

		// Find and Remove Arrow.
		for (let i = 0; i < columnElems.length; i++) {
			if (columnElems[i].children.length > 0) columnElems[i].removeChild(columnElems[i].children[0])
		}
  }
  
  // If the User wants to go to the currently-selected Airport on the Map, send back the data to the Container and pan to it.
  gotoAirport = () => {
		this.closeModal()

    return this.props.returnICAO(this.state.icao)
	}
	
	sortColumn = (group, col, sortOrder, e) => {		
		const copiedItems = JSON.parse(JSON.stringify(this.state.items)),
					elem = e.currentTarget || null,
					upArrow = UP_ARROW,
					downArrow = DOWN_ARROW

		// Change Order of Sort Direction.
		if (!sortOrder || sortOrder === 'ASC') {
			sortOrder = 'DESC';
		} else if (sortOrder === 'DESC') {
			sortOrder = 'ASC';
		}

		// Sort based on Sort Order and Data.
		const sortedResult = sortColumnData(copiedItems, group, col, sortOrder)
		
		// Re-insert data back into Items object.
		let items = this.state.items;
		items[group] = sortedResult;

    this.clearArrows(group)
    
    // Place Arrow in Clicked Column with updated direction.
		if (elem) {
			const arrowElem = `<span class='table__sortArrow'>${sortOrder === 'ASC' ? upArrow : downArrow}</span>`
			elem.insertAdjacentHTML('beforeend', arrowElem)		
		}

		this.setState({ 
			items,
			arrivals_sort_order: group === 1 ? sortOrder : this.state.arrivals_sort_order,
			arrivals_sort_column: group === 1 ? col : this.state.arrivals_sort_column,
			departures_sort_order: group === 0 ? sortOrder : this.state.departures_sort_order,
			departures_sort_column: group === 0 ? col : this.state.departures_sort_column,
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
				const arrowElem = `<span class='table__sortArrow'>${UP_ARROW}</span>`				
				columnElems_departures.insertAdjacentHTML('beforeend', arrowElem)
				columnElems_arrivals.insertAdjacentHTML('beforeend', arrowElem)
			}
		})
  }
  
  // If the user selects a Flight from the List, return the Callsign to the Container and find the Flight.
	returnData = callsign => {
		this.closeModal()
		this.props.returnData(callsign)
  }
  
  // Create click and key events to support closing the modal.
	componentDidMount = () => {
		const modal = document.getElementById('Modal_Icao')

    modal.addEventListener('click', e => {
      if (e.target.id === 'Modal_Icao') this.closeModal()
    })

		document.addEventListener('keydown', e => {
			if (e.key === 'Escape') this.closeModal()
		}, false);
	}

  // If there's data in the table, force the scroll view to the top.
  componentDidUpdate = () => {		
    const tables = document.getElementsByClassName("Modal__section")

    if (tables.length > 0 && (this.state.items[0] && this.state.items[0].length > 0)) {
			for (let i = 0; i < tables.length; i++) tables[i].scrollTop = 0
		}
  }
  
  // Update the ICAO Modal with Props Data.
	static getDerivedStateFromProps(nextProps, prevState) {    
    let items = prevState.items
    
    // Pass the latest Props data and persist the sorted columns if the Modal is open.
		if (nextProps.items && nextProps.items[1]) {
			const sortedDepartures = sortColumnData(nextProps.items, 0, prevState.departures_sort_column, prevState.departures_sort_order)
			const sortedArrivals = sortColumnData(nextProps.items, 1, prevState.arrivals_sort_column, prevState.arrivals_sort_order)		

			// Re-insert data back into Items object.
			items[0] = sortedDepartures
			items[1] = sortedArrivals
		}

		return {
      airport_name: nextProps.airport_name,
      controllers: nextProps.items[2],
			items: nextProps.items && nextProps.items[1] ? items : nextProps.items,
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
											<div className='table__data table__columnHeader callsign' 
												   onClick={elem => this.sortColumn(0, 'callsign', this.state.departures_sort_order, elem)}>Callsign</div>
											<div className='table__data table__columnHeader name'
													 onClick={elem => this.sortColumn(0, 'name', this.state.departures_sort_order, elem)}>Pilot's Name</div>
											<div className='table__data table__columnHeader planned_destairport'
													 onClick={elem => this.sortColumn(0, 'planned_destairport', this.state.departures_sort_order, elem)}>Arr. Location</div>
                    </div>
                    {this.state.items[0].length > 0 ? this.state.items[0].map((departureData, i) =>
                      <div className='table__row Modal__link'
													 data-icao={departureData.callsign}
													 onClick={() => this.returnData(departureData.callsign)}
													 key={i}>
                        <span className='table__data'>{departureData.callsign}</span>
                        <span className='table__data'>{departureData.name}</span>
                        <span className='table__data'>{departureData.planned_destairport}</span>
												<span className='table__data'>{departureData.distanceToGo}</span>
                      </div>
                    ) : (<div className='table__row --no-data'>
													<span className='table__data'>None</span>
												 </div>)}
                  </div>
                )}
						</section>
						<section className='Modal__section --arrivals'>
							<h2>Arrivals {this.state.items[1] && this.state.items[1].length > 0 ? `(${this.state.items[1].length})` : ``}</h2>
								{this.state.items[1] && (
									<div className='table'>
                    <div className='table__header table__row arrivals'>
											<div className='table__data table__columnHeader callsign'
													 onClick={elem => this.sortColumn(1, 'callsign', this.state.arrivals_sort_order, elem)}>Callsign</div>
											<div className='table__data table__columnHeader name'
													 onClick={elem => this.sortColumn(1, 'name', this.state.arrivals_sort_order, elem)}>Pilot's Name</div>
											<div className='table__data table__columnHeader planned_depairport'
													 onClick={elem => this.sortColumn(1, 'planned_depairport', this.state.arrivals_sort_order, elem)}>Dep. Location</div>
											<div className='table__data table__columnHeader distanceToGo'
													 onClick={elem => this.sortColumn(1, 'distanceToGo', this.state.arrivals_sort_order, elem)}>Distance To Go</div>
                    </div>
										{this.state.items[1].length > 0 ? this.state.items[1].map((arrivalData, i) =>
											<div className='table__row Modal__link'
													 data-icao={arrivalData.callsign}
													 onClick={() => this.returnData(arrivalData.callsign)}
													 key={i}>
                        <span className='table__data'>{arrivalData.callsign}</span>
                        <span className='table__data'>{arrivalData.name}</span>
                        <span className='table__data'>{arrivalData.planned_depairport}</span>
												<span className='table__data'>{arrivalData.distanceToGo}</span>
											</div>
										) : (<div className='table__row --no-data'>
													<span className='table__data'>None</span>
												</div>)}
									</div>
								)}
						</section>
					</div>
          <div className='Modal__sections'>
            <section className='Modal__section --atc'>
							<h2>Controllers</h2>
								{this.state.controllers && (
									<ul className='icao__list'>
										{this.state.controllers.length > 0 ? this.state.controllers.map((controllerData, i) =>
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
