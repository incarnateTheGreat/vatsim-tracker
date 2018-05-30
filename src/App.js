import React, { Component } from 'react';
import MapLeaflet from './components/MapLeaflet';
import './styles/styles.scss';

class App extends Component {
  render() {
    return (
      <div className='App'>
        <MapLeaflet />
      </div>
    );
  }
}

export default App;
