import React, { Component, StrictMode } from 'react';
import MapLeaflet from './components/MapLeaflet';
import './styles/styles.scss';

class App extends Component {
  render() {
    return (
      <StrictMode>
        <div className='App'>
          <MapLeaflet />
        </div>
      </StrictMode>
    );
  }
}

export default App;
