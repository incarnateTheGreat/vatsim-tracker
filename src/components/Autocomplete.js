import React, { Component } from 'react';

export default class Autocomplete extends Component {
	state = {
		items: null,
		searchCompareValue: '',
		sortedResult: []
	}

	// Navigate through results using Up/Down Keys.
	navigateItems = (e) => {
		if (this.state.sortedResult.length > 0 && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
			const listElemsLength = document.getElementsByClassName('autocomplete__result').length,
						listElem = document.getElementsByClassName('autocomplete__result');

			function checkBoundary(index) {
				if (index === listElemsLength) {
					return index - 1;
				} else if (index < 0) {
					return index + 1;
				} else {
					return index;
				}
			}

			switch (e.key) {
				case 'ArrowUp':
					listElem[checkBoundary(document.activeElement.tabIndex - 1)].focus()
					break
				case 'ArrowDown':
					listElem[checkBoundary(document.activeElement.tabIndex + 1)].focus()
					break
				default:
					break
			}
		} else if (e.key === 'Enter') {
			this.selectItem(e)
		}
	}

	onSelect = (value) => {
		this.props.onSelect(value)
	}

	selectItem = (e) => {
		document.getElementsByName('autocompleteValue')[0].value = e.target.innerHTML;
		this.onSelect(e.target.innerHTML)
		this.setState({ sortedResult: [] })
	}

	sortItems = (e) => {
		// Set first result of list elements as focused to allow for arrow key navigation.
		if (this.state.sortedResult.length > 0 && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
			if (!document.activeElement.className) {
				document.getElementsByClassName('autocomplete__result')[0].focus();
			}

			return;
		}

		const query = document.getElementsByName('autocompleteValue')[0].value,
					sortedResult = this.state.items.filter(item => {
						const regex = new RegExp(query, 'gi');
						return item[this.state.searchCompareValue].match(regex)
					})

		this.setState({ sortedResult })
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		// The object you return from this function will be merged with the current state.
		return {
			items: nextProps.items,
			searchCompareValue: nextProps.searchCompareValue
		};
	}

	render = () => {
		return (
			<div className='autocomplete'>
				<input
					onKeyUp={this.sortItems}
					name='autocompleteValue'
					placeholder={this.props.placeholder}
					type='search'
				/>
				{this.state.sortedResult && (
					<div className='autocomplete__results'>
						{this.state.sortedResult.map((item, i) =>
							<span
								onKeyUp={this.navigateItems}
								className='autocomplete__result'
								onClick={this.selectItem}
								key={i}
								tabIndex={i}>{item.callsign}</span>
						)}
				</div>
			)}
		</div>
		)
	}
}
