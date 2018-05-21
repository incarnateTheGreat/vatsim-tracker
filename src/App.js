import React, { Component } from 'react';
import Header from './components/Header';
import Map from './components/Map';
import './styles/styles.scss';

class App extends Component {
  render() {
    return (
      <div className='App'>
        <Header />
        <Map />
      </div>
    );
  }
}

export default App;
