import React, { Component } from 'react';
import {
  ComposableMap,
  ZoomableGroup,
  Geographies,
  Geography,
} from "react-simple-maps"
import mapFile from '../maps/world-110m';

export default class Map extends Component {
	render() {
		return (
			<div>
				<ComposableMap>
					<ZoomableGroup>
						<Geographies geography={mapFile}>
							{(geographies, projection) =>
								geographies.map(geography => (
									<Geography
										key={ geography.properties.POP_EST }
										geography={ geography }
										projection={ projection }
									/>
								))
							}
						</Geographies>
					</ZoomableGroup>
				</ComposableMap>
  </div>
		);
	}
}
