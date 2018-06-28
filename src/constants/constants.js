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
];

// Wind Degrees Key
const DEGREES_KEY = {
  'N1': [0, 11.25],
  'NNE': [11.25, 33.75],
  'NE': [33.75, 56.25],
  'ENE': [56.25, 78.75],
  'E': [78.75, 101.25],
  'ESE': [101.25, 123.75],
  'SE': [123.75, 146.25],
  'SSE': [146.25, 168.75],
  'S': [168.75, 191.25],
  'SSW': [191.25, 213.75],
  'SW': [213.75, 236.25],
  'WSW': [236.25, 258.75],
  'W': [258.75, 281.25],
  'WNW': [281.25, 303.75],
  'NW': [303.75, 326.25],
  'NNW': [326.25, 348.75],
  'N2': [348.75, 360]
};

// Stub data
const CITIES = [
  { name: "Toronto", coordinates: [-79.369,43.862] },
  { name: "Singapore", coordinates: [103.8198,1.3521] },
  { name: "San Francisco", coordinates: [-122.4194,37.7749] },
  { name: "Sydney", coordinates: [151.2093,-33.8688] },
  { name: "Zurich", coordinates: [8.5417,47.3769] },
  { name: "Tokyo", coordinates: [139.6917,35.6895], population: 37843000 },
  { name: "Jakarta", coordinates: [106.8650,-6.1751], population: 30539000 },
  { name: "Delhi", coordinates: [77.1025,28.7041], population: 24998000 },
  { name: "Manila", coordinates: [120.9842,14.5995], population: 24123000 },
  { name: "Seoul", coordinates: [126.9780,37.5665], population: 23480000 },
  { name: "Shanghai", coordinates: [121.4737,31.2304], population: 23416000 },
  { name: "Karachi", coordinates: [67.0099,24.8615], population: 22123000 },
  { name: "Beijing", coordinates: [116.4074,39.9042], population: 21009000 },
  { name: "New York", coordinates: [-74.0059,40.7128], population: 20630000 },
  { name: "Guangzhou", coordinates: [113.2644,23.1291], population: 20597000 },
  { name: "Sao Paulo", coordinates: [-46.6333,-23.5505], population: 20365000 },
  { name: "Mexico City", coordinates: [-99.1332,19.4326], population: 20063000 },
  { name: "Mumbai", coordinates: [72.8777,19.0760], population: 17712000 },
  { name: "Osaka", coordinates: [135.5022,34.6937], population: 17444000 },
  { name: "Moscow", coordinates: [37.6173,55.7558], population: 16170000 },
  { name: "Dhaka", coordinates: [90.4125,23.8103], population: 15669000 },
  { name: "Cairo", coordinates: [31.2357,30.0444], population: 15600000 },
  { name: "Los Angeles", coordinates: [-118.2437,34.0522], population: 15058000 },
  { name: "Bangkok", coordinates: [100.5018,13.7563], population: 14998000 },
  { name: "Kolkata", coordinates: [88.3639,22.5726], population: 14667000 },
  { name: "Buenos Aires", coordinates: [-58.3816,-34.6037], population: 14122000 },
  { name: "Tehran", coordinates: [51.3890,35.6892], population: 13532000 },
  { name: "Istanbul", coordinates: [28.9784,41.0082], population: 13287000 },
  { name: "Lagos", coordinates: [3.3792,6.5244], population: 13123000 },
  { name: "Shenzhen", coordinates: [114.0579,22.5431], population: 12084000 },
  { name: "Rio de Janeiro", coordinates: [-43.1729,-22.9068], population: 11727000 },
  { name: "Kinshasa", coordinates: [15.2663,-4.4419], population: 11587000 },
  { name: "Tianjin", coordinates: [117.3616,39.3434], population: 10920000 },
  { name: "Paris", coordinates: [2.3522,48.8566], population: 10858000 },
  { name: "Lima", coordinates: [-77.0428,-12.0464], population: 10750000 }
];

const REFRESH_TIME = 30000;

const MAX_BOUNDS = [[-90, -180],[90, 180]];

const FLIGHT_DATA = ["OKRTR:1300515:Ramon van Voorst EHAM:PILOT::49.78295:12.92036:4227:127:C172/A:115:LKHV:4500:EDBJ:GERMANY:100:1:7000:::0:V:0:0:0:0:0:0:: /v/::0:0:0:0:::20180523140521:337:30.038:1017:",
"PAL103:1141625:Wilson Dela Cruz RPLL:PILOT::17.88069:129.65628:35980:464:H/B77W/L:480:KLAX:30000:RPLL:SINGAPORE:100:1:7065:::4:I:0:0:15:45:16:45:RPLC:  /v/ SEL/GQFH:+PRCH3 PERCH BEFIN DCT AUDIA DCT 35N130W 36N140W/N0491F320 34N150W 33N160W 32N170W/N0485F340 31N180W 29N170E 28N160E/N0485F360 26N150E 21N140E 18N130E/N0484F380 DCT POLIO POLI1R:0:0:0:0:::20180523012659:251:29.898:1012:",
"PAL104:1414751:RJ Bolduc KJAX:PILOT::52.63593:-173.44667:30479:526:H/777/L:270:RPLL:31000:KSFO:USA-E:100:1:1200:::0:I:815:0:11:16:12:0:KSMF:  /v/:JOM2C JOM A590 YOSHI SUNNS SCORE R591 ADNAP OTR5 KALNA G344 CARTO R336 ADK LONOK DUT HBT 53N150W 49N140W 43N130W PEENO BDEGA2:0:0:0:0:::20180523064037:70:29.398:995:",
"PBD419:1247518:Sergei Kozhin:PILOT::56.09959:68.67221:35215:488:B738/Q:460:UUWW:F350:UNNT:RUSSIA-W:100:1:2000:::1:I:1250:1250:3:40:4:30:UNEE:+VFPS+/V/RMK/CALLSIGN POBEDA REG/VQBTE RTE/DP419 OPR/AFL-GROUP.SOYUZ.AERO:N0460F350 BITSA DCT GEKLA DCT DAKLO DCT SF L158 GAMDI R487 RP T637 OK T872 NOGRI L94 KEROM R834 LUKAS L166 GISMA B926 SZ W1 GOLIM:0:0:0:0:::20180523121820:79:30.15:1020:",
"PCH001:1394215:Mario Topski:PILOT::51.78047:21.16815:7490:267:B738/L:450:LOWI:FL410:EPWA:GERMANY2:100:1:4673:::1:I:1320:0:0:0:0:0:EPLL:/v/ XSquawkBox // Call TUI JET // OPR/www.lotvirtual.pl // Learning English, please Talk slowly. Thanks ;):RTT DCT ABTAN DCT ABLOM DCT MEBAN M985 KOTEK M866 LOGDA:0:0:0:0:::20180523125517:28:30.15:1020:",
"QFA11:1299865:Christoffer Paulsen ENTC:PILOT::33.94331:-118.41140:140:0:H/B744/L:493:KLAX:37000:KJFK:SWEDEN:100:1:1200:::1:I:1520:1520:4:20:5:47:KEWR:+VFPS+/V/PBN/A1B1C1D1L1O1S1 NAV/RNVD1E2A1 DOF/180523 REG/VHOEI EET/KZDV0048 KZMP0159 KZAU0229 KZOB0315 KZWY0349 SEL/MQJS RVR/75 PER/E :ORCKA2 BEALE J146 DVC/N0490F390 J197 HGO DCT PWE J64 BDF DCT OXI DCT DJB DCT YNG DCT ETG DCT LVZ LENDY6:0:0:0:0:::20180523141302:82:29.959:1014:",
"QFA128:1196492:Richard Nobes YPAD:PILOT::4.45897:123.45850:34853:496:H/B744/S:500:VHHH:FL330:YSSY:AUSTRALIA:100:1:2000:::1:I:1200:1200:8:19:9:33::+VFPS+/V/PBN/A1B1C1D1L1O1S2 NAV/RNP2 RNVD1A1 DOF/180523 REG/VHOJU SEL/JKDQ ORGN/YSSYQFAO PER/D:M084F330 DCT OCEAN V5 SABNO A583 ZAM A461 MOLLY/M084F350 A461 BUTPA/M084F370 A461 DN J251 TN T74 ENPAG H319 TARAL Y59 RIVET:0:0:0:0:::20180523114633:150:29.772:1008:",
"QFA132:1313735:Dace Nicmane EDDL:PILOT::-38.68329:147.31134:34304:410:B763/L:460:NZCH:34000:YMML:GERMANY:100:1:2000:::1:I:1150:1150:3:20:4:0::+VFPS+/V/ REG/VH-OGI SEL/LQBK RMK/STEP CLIMB RMK/MAY HAVE TO SWITCH TO /R:KABIN L508 OMKIN L508 MILLA P753 WAREN:0:0:0:0:::20180523112323:289:30.248:1024:",
"QFA20:1239164:Matthew Smith EGLL:PILOT::7.11780:125.66419:34876:509:H/B744/L:515:RPLL:33000:YSSY:GERMANY:100:1:1352:::10:I:1730:0:6:45:8:39:YSRI:PBN/A1B1C1D1L1O1S1 NAV/RNVD1E2A1 DOF/180523 REG/VHOEG EET/WAAF0132 YBBB0326 YMMM0641 RVR/75 PER/E /V/:N0515F330 CON2A CONDE W11 MCT W8 DAO B473 SADAN B473 SAMGE/N0514F350 B473 OPABA B587 DOLIB/N0504F370 B587 NBR UH209 SCO W551 YAKKA W180 MEPIL"];

const SERVER_PATH = 'http://localhost:8000';

module.exports = {
  CLIENT_LABELS,
  CITIES,
  DEGREES_KEY,
  FLIGHT_DATA,
  MAX_BOUNDS,
  REFRESH_TIME,
  SERVER_PATH
};
