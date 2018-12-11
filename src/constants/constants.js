// Constants
const CLIENT_LABELS = [
  'callsign',
  'cid',
  'realname',
  'clienttype',
  'frequency',
  'latitude',
  'longitude',
  'altitude',
  'groundspeed',
  'planned_aircraft',
  'planned_tascruise',
  'planned_depairport',
  'planned_altitude',
  'planned_destairport',
  'server',
  'protrevision',
  'rating',
  'transponder',
  'facilitytype',
  'visualrange',
  'planned_revision',
  'planned_flighttype',
  'planned_deptime',
  'planned_ctdeptime',
  'planned_hrsenroute',
  'planned_minenroute',
  'planned_hrsfuel',
  'planned_minfuel',
  'planned_altairport',
  'planned_remarks',
  'planned_route',
  'planned_depairport_lat',
  'planned_depairport_lon',
  'planned_destairport_lat',
  'planned_destairport_lon',
  'atis_message',
  'time_last_atis_received',
  'time_logon',
  'heading',
  'QNH_iHg',
  'QNH_Mb'
]

// Wind Degrees Key
const DEGREES_KEY = {
  'N1': [0, 11.25],
  'North North-East': [11.25, 33.75],
  'North-East': [33.75, 56.25],
  'East North-East': [56.25, 78.75],
  'East': [78.75, 101.25],
  'East South-East': [101.25, 123.75],
  'South-East': [123.75, 146.25],
  'South South-East': [146.25, 168.75],
  'South': [168.75, 191.25],
  'South South-West': [191.25, 213.75],
  'South-West': [213.75, 236.25],
  'West South-West': [236.25, 258.75],
  'West': [258.75, 281.25],
  'West North-West': [281.25, 303.75],
  'North-West': [303.75, 326.25],
  'North North-West': [326.25, 348.75],
  'N2': [348.75, 360]
}

const REFRESH_TIME = 15000;

const MAX_BOUNDS = [[-90, -180],[90, 180]];

const SERVER_PATH = 'http://localhost:8000';

const CURRENTLY_UNAVAILABLE = 'Currently Unavailable'

const UP_ARROW = '&#9650'

const DOWN_ARROW = '&#9660'

const ICAO_LETTERS_SUPPORTED = [
  'C', // Canada
  'M', // Mexico
  'K', // United States
  'P', // Alaska, Hawaii, and any other U.S-related Territory
  'T'  // Caribbean
]

const VATSIM_SERVERS = [
  'http://vatsim-data.hardern.net/vatsim-data.txt',
  'http://vatsim.aircharts.org/vatsim-data.txt',
  'http://info.vroute.net/vatsim-data.txt'
]

module.exports = {
  CLIENT_LABELS,
  CURRENTLY_UNAVAILABLE,
  DEGREES_KEY,
  DOWN_ARROW,
  ICAO_LETTERS_SUPPORTED,
  MAX_BOUNDS,
  REFRESH_TIME,
  SERVER_PATH,
  UP_ARROW,
  VATSIM_SERVERS
}
