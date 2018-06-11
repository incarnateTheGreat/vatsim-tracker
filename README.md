# Vatsim Tracker

This application utilizes Leaflet to display live VATSIM data. You can search for Callsigns or click on Aircraft to see where they are in the (virtual) world.

![VATSIM Tracker](https://github.com/incarnateTheGreat/vatsim/blob/master/vatsimTracker.png?raw=true)

## Installation

Run the following from the Command Line:

```
git clone https://github.com/incarnateTheGreat/vatsim

cd vatsim
```

Once the above steps are complete, download the latest dependencies by running:

```
npm install
```

## Development Server

1) From the Command Line, run `npm start`.

2) Navigate to `http://localhost:3030/`.

## Information Server

In order to gather VATSIM and Aiport data, you need to have an Express Server running in the background.

1) From the Command Line, open a new tab.

2) Run `node server.js`.

3) Should `Server Started!`

## Tech Stack

Using:

- React
- Leaflet (and React Leaflet)
- Axios
- Express
