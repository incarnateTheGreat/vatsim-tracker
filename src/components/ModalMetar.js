import React, { Component, Fragment } from "react";
import classNames from "classnames";
import { DEGREES_KEY, CURRENTLY_UNAVAILABLE } from "../constants/constants";

class ModalMetar extends Component {
  state = {
    airport_name: null,
    icao: null,
    isModalOpen: false,
    metar: null,
    metar_current_weather: null,
    metar_current_weather_title: null
  };

  closeModal = () => {
    this.setState({ isModalOpen: false });
  };

  // Convert Statue Miles to Kilmetres.
  convertSMtoKM = sm => {
    const conversion = Math.round(1.609344 * sm);

    return `${conversion} KM`;
  };

  // If the User wants to go to the currently-selected Airport on the Map, send back the data to the Container and pan to it.
  gotoAirport = () => {
    this.closeModal();
    return this.props.returnICAO(this.state.icao);
  };

  getMETAR = () => {
    this.closeModal();
  };

  // Determine the correct Atmospheric Pressure for the geographic area:
  // hPa (Europe and most of the world), or Hg (North America)
  getAltimeter = altimeter => {
    const { inches, millibars } = altimeter;

    if (altimeter) {
      return `${inches} Hg | ${millibars} hPa` || "unavailable";
    } else {
      return CURRENTLY_UNAVAILABLE;
    }
  };

  // Get and Display the Temperature.
  getTemperature = temperature => {
    if (temperature.hasOwnProperty("celsius")) {
      return temperature
        ? `${temperature.celsius}${String.fromCodePoint(176)}C | ${Math.round(
            temperature.fahrenheit
          )}${String.fromCodePoint(176)}F`
        : CURRENTLY_UNAVAILABLE;
    }
  };

  // Use the Degrees Key to approximate the Range of what direction the Wind is currently blowing.
  getWindDirection = deg => {
    for (let x in DEGREES_KEY) {
      if (deg >= DEGREES_KEY[x][0] && deg <= DEGREES_KEY[x][1]) {
        // Return North based on two different ranges.
        if (x === "N1" || x === "N2") {
          return "North";
        } else {
          return x;
        }
      }
    }
  };

  // Return the Wind data.
  getWind = () => {
    return (
      <span>
        {`From the ${this.getWindDirection(
          this.state.metar["wind"]["direction"]
        )} at ${Math.round(
          this.state.metar["wind"]["speedKt"]
        )} kts | ${Math.round(this.state.metar["wind"]["speedMps"])} mph`}
      </span>
    );
  };

  // Determine the Visibility based on the data available. Otherwise, show as 'Unavailable'.
  getVisibility = visibility => {
    let visibilityData = "";

    if (visibility === 9999) {
      visibilityData = 9999;
    } else if (!visibility) {
      visibilityData = "Unavailable";
    } else {
      visibilityData = `${visibility.miles} SM (${this.convertSMtoKM(
        visibility.miles
      )})`;
    }

    return visibilityData;
  };

  toggleModal = () => {
    this.setState({ isModalOpen: this.state.isModalOpen ? false : true });
  };

  // Create click and key events to support closing the modal.
  componentDidMount = () => {
    const modal = document.getElementById("Modal_Metar");

    modal.addEventListener("click", e => {
      if (e.target.id === "Modal_Metar") this.closeModal();
    });

    document.addEventListener(
      "keydown",
      e => {
        if (e.key === "Escape") this.closeModal();
      },
      false
    );
  };

  static getDerivedStateFromProps(nextProps) {
    if (nextProps.metar && nextProps.icao) {
      return {
        airport_name: nextProps.airport_name,
        icao: nextProps.icao.toUpperCase(),
        metar: nextProps.metar,
        metar_current_weather: nextProps.metar_current_weather,
        metar_current_weather_title: nextProps.metar_current_weather_title
      };
    } else {
      return null;
    }
  }

  render() {
    const modalClasses = classNames(
      "Modal",
      this.state.isModalOpen ? "--open" : ""
    );

    let weatherClasses = "";

    if (this.state.metar) {
      weatherClasses = classNames("wi", this.state.metar_current_weather);
    }

    return (
      <div id="Modal_Metar" className={modalClasses}>
        <div className="Modal__container --weather">
          <header>
            <div>
              <h1>
                {this.state.icao} ({this.state.airport_name})
              </h1>
              <div className="Modal__container__goTo">
                <h5
                  className="Modal__gotoAirport"
                  onClick={() => this.gotoAirport()}
                >
                  Go to Airport
                </h5>
                |
                <h5
                  className="Modal__gotoAirport"
                  onClick={() => this.getMETAR()}
                >
                  Get METAR
                </h5>
              </div>
            </div>
            <span onClick={this.closeModal.bind(this)} className="close">
              X
            </span>
          </header>
          <div className="Modal__sections --weather">
            <section className="Modal__section --weather">
              {this.state.metar && (
                <Fragment>
                  <div className="Modal__weatherIcon">
                    <i
                      title={this.state.metar_current_weather_title}
                      className={weatherClasses}
                    ></i>
                  </div>
                  <div className="Modal__weatherData">
                    <div className="Modal__weatherContainer">
                      <span>Temperature</span>
                      <span>
                        {this.getTemperature(this.state.metar["temperature"])}
                      </span>
                    </div>
                    <div className="Modal__weatherContainer">
                      <span>Wind</span>
                      {this.getWind()}
                    </div>
                    <div className="Modal__weatherContainer">
                      <span>Visibility</span>
                      <span>
                        {this.getVisibility(this.state.metar["visibility"])}
                      </span>
                    </div>
                    <div className="Modal__weatherContainer">
                      <div>Clouds</div>
                      <div>
                        <ul className="Modal__weatherContainer__list">
                          {this.state.metar["clouds"] ? (
                            this.state.metar["clouds"].map((metarData, i) =>
                              metarData["abbreviation"] === "NCD" ? (
                                <li key={i}>{metarData["meaning"]}</li>
                              ) : (
                                <li key={i}>
                                  {metarData["meaning"]} at{" "}
                                  {metarData["altitude"]} FT.
                                </li>
                              )
                            )
                          ) : (
                            <li>{CURRENTLY_UNAVAILABLE}</li>
                          )}
                        </ul>
                      </div>
                    </div>
                    <div className="Modal__weatherContainer">
                      <span>Altimeter</span>
                      <span>
                        {this.getAltimeter(this.state.metar["altimeter"])}
                      </span>
                    </div>
                    <div className="Modal__weatherContainer">
                      <div>Weather</div>
                      <span className="Modal__weatherContainer__title">
                        {this.state.metar_current_weather_title ? (
                          this.state.metar_current_weather_title
                        ) : (
                          <span>Nothing to report.</span>
                        )}
                      </span>
                    </div>
                  </div>
                </Fragment>
              )}
            </section>
          </div>
        </div>
      </div>
    );
  }
}

export default ModalMetar;
