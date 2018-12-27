(() => {
    // Collect Data
    const fs = require('fs');
    const util = require('util');    

    // Convert fs.readFile into Promise version of same    
    const readFile = util.promisify(fs.readFile);

    async function getJSON(file) {
        return await readFile(file);
    }

    const init = async () => {
        let fir_boundaries = await getJSON('fir-boundaries.json');
        let fir_list = await getJSON('myjsonfile.json');

        fir_boundaries = JSON.parse(fir_boundaries);
        fir_list = new Map(JSON.parse(fir_list));
        
        for (let x in fir_boundaries) {
            const icao = fir_boundaries[x].icao;

            if (fir_list.get(icao) || fir_list.get(icao) !== undefined) {
                fir_boundaries[x]['region'] = fir_list.get(icao)[0];
                fir_boundaries[x]['country'] = fir_list.get(icao)[1];
            }
        }

        fs.writeFileSync('fir_boundaries_update.json', JSON.stringify(fir_boundaries), 'utf8');
    }

    init();

    /////////

    // Strip data and create.
    // const body = fs.readFileSync('fir_names.txt', 'utf8');    
    // const lines = body.split('\n');
    // let currentRow = {};
    // let key = '';
    // let tempString = '';
    // let tempArray = [];
    // let finalArray = [];
    // let isRecording = false;

    // let myMap = new Map();

    // for (let line = 0; line < lines.length; line++) {        
    //     if (lines[line] === '|-') {
    //         isRecording = false; // Stop Recording.

    //         // Only push data if the TempArray has content.
    //         if (tempArray.length > 0) {
    //             currentRow[key] = tempArray; // Push Temp Array into Current Row.
    //             finalArray.push(currentRow); // Push Current Row into Final Array.
    //             myMap.set(key, tempArray);
    //             currentRow = {}; // Clear.
    //             tempArray = []; // Clear.
    //         }
            
    //         key = lines[line + 1].replace('| ', ''); // Update with the new Key.
    //     } else {
    //         isRecording = true;
    //     }

    //     // Begin recording data. Remove additional string content and then push.
    //     if (isRecording) {
    //         let str = lines[line].replace('| ', '');
            
    //         if (str !== 'FIR' && str !== key) {
    //             tempArray.push(str);
    //         }
    //     }
    // }    

    // fs.writeFileSync('myjsonfile.json', JSON.stringify([...myMap]), 'utf8');
    
})()