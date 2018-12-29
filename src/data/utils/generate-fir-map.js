// Collect Data
const fs = require('fs');
const util = require('util'); 

// Strip data and create.
const body = fs.readFileSync('../fir-names.txt', 'utf8');    
const lines = body.split('\n');

let key = '';
let tempArray = [];
let isRecording = false;
let fir_map = new Map();

for (let line = 0; line < lines.length; line++) {        
    if (lines[line] === '|-') {
        // Stop Recording.
        isRecording = false;

        // Only push data if the TempArray has content.
        if (tempArray.length > 0) {
            fir_map.set(key, tempArray);
            tempArray = [];
        }
        
        // Update with the new Key.
        key = lines[line + 1].replace('| ', '');
    } else {
        isRecording = true;
    }

    // Begin recording data. Remove additional string content and then push.
    if (isRecording) {
        let str = lines[line].replace('| ', '');
        
        if (str !== 'FIR' && str !== key) {
            tempArray.push(str);
        }
    }
}    

// Convert fs.readFile into Promise version of same    
const readFile = util.promisify(fs.readFile);

async function getJSON(file) {
    return await readFile(file);
}

const init = async () => {
    let fir_boundaries = await getJSON('../fir-boundaries.json');
    fir_boundaries = JSON.parse(fir_boundaries);
    
    for (let x in fir_boundaries) {
        const icao = fir_boundaries[x].icao;

        if (fir_map.get(icao) || fir_map.get(icao) !== undefined) {
            fir_boundaries[x]['region'] = fir_map.get(icao)[0];
            fir_boundaries[x]['country'] = fir_map.get(icao)[1];
        }
    }

    fs.writeFileSync('../fir-boundaries-v2.json', JSON.stringify(fir_boundaries), 'utf8');
}

init();
