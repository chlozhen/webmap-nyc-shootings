mapboxgl.accessToken = 'pk.eyJ1IjoiY2hsb3poZW4iLCJhIjoiY2xnNXFlMGkxMDF0YzNobjBzeDZ3dTRodyJ9.aEmIpsNVZeh27U2L1z7j_A';

const NY_STATE = [-74.00582689446452, 40.69493697556761]
const main_layer_id = 'Gun Violence Incident'
const data_file = './data/gun-violence-nyc-06-22.geojson'
const default_left_year = 2006
const default_right_year = 2021

// Set up comparison maps
const beforeMap = new mapboxgl.Map({
    container: 'before',
    // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
    style: 'mapbox://styles/mapbox/dark-v11',
    center: NY_STATE,
    zoom: 11
});
const afterMap = new mapboxgl.Map({
    container: 'after',
    style: 'mapbox://styles/mapbox/dark-v11',
    center: NY_STATE,
    zoom: 11
});
const container = '#comparison-container';
const map = new mapboxgl.Compare(beforeMap, afterMap, container, {
    // Set this to enable comparing two maps by mouse movement:
    // mousemove: true
});

// add navigation controls
beforeMap.addControl(new mapboxgl.NavigationControl(), 'bottom-left');
afterMap.addControl(new mapboxgl.NavigationControl(), 'bottom-left');


// function to load before and after maps
function loadMap(map, year) {
    map.on('load', () => {
        map.addSource('gun-violence', {
            type: 'geojson',
            data: data_file,
        });

        map.addLayer({
            id: main_layer_id,
            type: 'circle',
            source: 'gun-violence',
            paint: {
                'circle-color': [
                    'match',
                    ['get', 'STATISTICAL_MURDER_FLAG'],
                    "True",
                    '#a63603', //red
                    "False",
                    '#fdbe85',
                    '#ccc'
                ],
                'circle-radius': 4,
                'circle-opacity': .9
            }
        });

        // default filter is 2006 (beforeMap) vs. 2021 (afterMap)
        map.setFilter(main_layer_id, ['==', ['get', 'YEAR'], year])

        map.on('click', main_layer_id, (e) => {
            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`
                        <table class="key-value-table">
                            <tr>
                                <td class="key">Date</td>
                                <td class="value">${e.features[0].properties.OCCUR_DATE}</td>
                            </tr>
                            <tr>
                                <td class="key">Location</td>
                                <td class="value">${e.features[0].properties.LOCATION_DESC}</td>
                            </tr>
                            <tr>
                                <td class="key">Victim Death</td>
                                <td class="value">${e.features[0].properties.STATISTICAL_MURDER_FLAG}</td>
                            </tr>
                            <tr>
                                <td class="key">Victim Sex/Age/Race</td>
                                <td class="value">${e.features[0].properties.VIC_SEX}/${e.features[0].properties.VIC_AGE_GROUP}/${e.features[0].properties.VIC_RACE}</td>
                            </tr>
                            <tr>
                                <td class="key">Perp Sex/Age/Race</td>
                                <td class="value">${e.features[0].properties.PERP_SEX}/${e.features[0].properties.PERP_AGE_GROUP}/${e.features[0].properties.PERP_RACE}</td>
                            </tr>
                            <tr>
                                <td class="key">jurisdiction code</td>
                                <td class="value">${e.features[0].properties.JURISDICTION_CODE}</td>
                            </tr>
                            <tr>
                                <td class="key">precinct</td>
                                <td class="value">${e.features[0].properties.PRECINCT}</td>
                            </tr>
                        </table>
                        `)
                .addTo(map);
        });

    });
}

// load both maps
loadMap(beforeMap, default_left_year)
loadMap(afterMap, default_right_year)


// interactions: update stats about current data on the sidebar - help from chatGPT

// function to generate statistics
function generateStatistics(data, year) {
    let totalIncidents = 0;
    let incidentsByBoro = {};
    let murderIncidents = 0;

    // Iterate over each feature in the data
    data.features.forEach(feature => {
        // Check if the feature's year matches the provided year
        if (feature.properties.YEAR == year) {
            totalIncidents++;
            // Count incidents by borough
            let borough = feature.properties.BORO;
            if (incidentsByBoro[borough]) {
                incidentsByBoro[borough]++;
            } else {
                incidentsByBoro[borough] = 1;
            }
            // Count incidents with statistical murder flag true
            if (feature.properties.STATISTICAL_MURDER_FLAG == "True") {
                murderIncidents++;
            }
        }
    });
    // Calculate percentage of incidents by borough
    let boroPercentages = {};
    for (let boro in incidentsByBoro) {
        boroPercentages[boro] = (incidentsByBoro[boro] / totalIncidents) * 100;
    }
    // Calculate percentage of incidents with murder flag true
    let murderPercentage = (murderIncidents / totalIncidents) * 100;
    return {
        totalIncidents: totalIncidents,
        boroPercentages: boroPercentages,
        murderPercentage: murderPercentage
    };
}

// function to get the statistics and format the text for the table 
function formatStatistics(table_id, year) {
    fetch(data_file)
        .then(response => response.json())
        .then(data => {
            const stats = generateStatistics(data, year);
            console.log(stats.boroPercentages)
            var stats_txt = `
              <tr>
                  <td class="key">Year</td>
                  <td class="value">${year}</td>
              </tr>
              <tr>
                  <td class="key">Total Incidents</td>
                  <td class="value">${stats.totalIncidents}</td>
              </tr>
              <tr>
                  <td class="key">% of Fatal Incidents</td>
                  <td class="value">${stats.murderPercentage.toFixed(2)}%</td>
              </tr>
              <tr>
                  <td class="key">% of Incidents by Boro</td>
                  <td class="value">
                      BRK: ${stats.boroPercentages["BROOKLYN"].toFixed(2)}% </br>
                      MAN: ${stats.boroPercentages["MANHATTAN"].toFixed(2)}% </br>
                      BRX: ${stats.boroPercentages["BRONX"].toFixed(2)}% </br>
                      STA: ${stats.boroPercentages["STATEN ISLAND"].toFixed(2)}% </br>
                      QUE: ${stats.boroPercentages["QUEENS"].toFixed(2)}%
                  </td>
              </tr>`
            var table = document.getElementById(table_id);
            table.innerHTML = stats_txt;
        })
}

// set up the default stats on sidebar
const stats_left = "stats_left"
const stats_right = "stats_right"
formatStatistics(stats_left, default_left_year)
formatStatistics(stats_right, default_right_year)


// interactions: allow users to choose years with a dropdown menu
function loadDropdownMenus(dropdown) {
    for (var i = 2006; i <= 2021; i++) {
        var option = document.createElement("option");
        option.id = i
        option.text = i;
        option.value = i;
        dropdown.add(option);
    }
}
var dropdown_left = document.getElementById("dropdown_left");
var dropdown_right = document.getElementById("dropdown_right");
loadDropdownMenus(dropdown_left)
loadDropdownMenus(dropdown_right)


// update the map and the tables based on selection
function onYearSelected(side) {
    var dropdown = document.getElementById("dropdown_" + side);
    var selectedYear = dropdown.options[dropdown.selectedIndex].value;
    // console.log("Selected year on " + side + " side: " + selectedYear);

    if (side == "left") {
        beforeMap.setFilter(main_layer_id, null);
        beforeMap.setFilter(main_layer_id, ['==', ['get', 'YEAR'], parseInt(selectedYear)])
        formatStatistics(stats_left, selectedYear)
    } else {
        afterMap.setFilter(main_layer_id, null);
        afterMap.setFilter(main_layer_id, ['==', ['get', 'YEAR'], parseInt(selectedYear)])
        formatStatistics(stats_right, selectedYear)
    }
}



