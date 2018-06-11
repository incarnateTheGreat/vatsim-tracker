import React, { Component, StrictMode } from 'react';
import VatsimMap from './components/VatsimMap';
import './styles/styles.scss';

class App extends Component {
  render() {
    return (
      <StrictMode>
        <div className='App'>
          <VatsimMap />
        </div>
      </StrictMode>
    );
  }
}

export default App;
