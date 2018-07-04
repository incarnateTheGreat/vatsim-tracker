import React, { Component } from 'react'

export default class Autocomplete extends Component {
	state = {
		items: null,
		searchCompareValue: '',
		sortedResult: []
	}

	inputRef = React.createRef()
	resultRef = React.createRef()

	// Navigate through results using Up/Down Keys.
	navigateItems = (e) => {
		if (this.state.sortedResult.length > 0 && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
			const listElemsLength = this.resultRef.current.children.length,
						listElem = this.resultRef.current.children

			function checkBoundary(index) {
				if (index === listElemsLength) {
					return index - 1
				} else if (index < 0) {
					return index + 1
				} else {
					return index
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

	selectItem = (e, isTextInput) => {
		let textInput = null

		if (isTextInput) {
			textInput = e
		} else {
			this.inputRef.current.value = e.target.innerHTML
			textInput = e.target.innerHTML
		}

		this.onSelect(textInput)
		this.setState({ sortedResult: [] })
	}

	sortItems = (e) => {
		const query = this.inputRef.current.value.toUpperCase()

		// Manual text input with Enter control.
		if (e.key === 'Enter' && query.length > 0) {
			this.selectItem(query, true)
			return
		}

		// Set first result of list elements as focused to allow for arrow key navigation.
		if (this.state.sortedResult.length > 0 && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
			if (!document.activeElement.className) {
				this.resultRef.current.children[0].focus()
			}

			return
		}

		if (query.length > 0) {
			let sortedResult = null;

			// If the Items' children are objects, then filter and map out results.
			// Otherwise, treat the Items as a one-dimensional Array.
			if (typeof this.state.items[0] === 'object') {
				sortedResult = this.state.items
					.filter(item => {
						const regex = new RegExp(query, 'gi')
						return item[this.state.searchCompareValue].match(regex)
					})
					.map(obj => obj[this.state.searchCompareValue])
			} else {
				sortedResult = this.state.items.filter(item => {
					const regex = new RegExp(query, 'gi')
					return item.match(regex)
				})
			}

			this.setState({ sortedResult })
		} else {
      // Clears Autocomplete results when the input is blank.
      this.setState({ sortedResult: [] })
    }
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		return {
			items: nextProps.items,
			searchCompareValue: nextProps.searchCompareValue
		}
	}

	render = () => {
		return (
			<div className='autocomplete'>
				<input
					onKeyUp={this.sortItems}
					placeholder={this.props.placeholder}
					ref={this.inputRef}
					type='search'
				/>
				{this.state.sortedResult && (
					<div className='autocomplete__results' ref={this.resultRef}>
						{this.state.sortedResult.map((item, i) =>
							<span
								className='autocomplete__result'
								onKeyUp={this.navigateItems}
								onClick={this.selectItem}
								key={i}
								tabIndex={i}>{item}</span>
						)}
				</div>
			)}
		</div>
		)
	}
}
