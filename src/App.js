import React, { Component, lazy, Suspense } from 'react';
import './styles/styles.scss';

const VatsimMap = lazy(() => import('./components/VatsimMap')),
      height = window.innerHeight,
      width = window.innerWidth,
      styles = {
        alignItems: 'center',
        backgroundColor: 'rgb(171, 210, 225)',
        display: 'flex',
        height: height,
        justifyContent: 'center', 
        width: width
      }

class App extends Component {
  render() {
    return (
      <Suspense fallback={<div style={styles} className='Loading'>Loading...</div>}>
        <VatsimMap />
      </Suspense>
    );
  }
}

export default App;
