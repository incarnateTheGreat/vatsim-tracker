import React, { Component } from 'react';

export default class Autocomplete extends Component {
	state = {
		items: null,
		searchCompareValue: '',
		sortedResult: null
	}

	selectItem = (e) => {
		document.getElementsByName('autocompleteValue')[0].value = e.target.innerHTML;
		this.onSelect(e.target.innerHTML)
		this.setState({ sortedResult: null })
	}

	onSelect = (value) => {
		this.props.onSelect(value)
	}

	sortItems = () => {
		const query = document.getElementsByName('autocompleteValue')[0].value

		const sortedResult = this.state.items.filter(item => {
			const regex = new RegExp(query, 'gi');
			return item[this.state.searchCompareValue].match(regex)
		})

		this.setState({ sortedResult }, () => {
			document.getElementsByClassName('autocomplete__result')[0].focus();
		})
	}

	componentDidUpdate = () => {
		// if (this.props.clearInput) {
		// 	document.getElementsByName('autocompleteValue')[0].value = '';
		// }
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
