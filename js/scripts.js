mapboxgl.accessToken = 'pk.eyJ1IjoiY2hsb3poZW4iLCJhIjoiY2xnNXFlMGkxMDF0YzNobjBzeDZ3dTRodyJ9.aEmIpsNVZeh27U2L1z7j_A';

const NY_STATE = [-75.64111393235906, 42.78891704234759]

const beforeMap = new mapboxgl.Map({
    container: 'before',
    // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
    style: 'mapbox://styles/mapbox/dark-v11',
    center: NY_STATE,
    zoom: 6
});

const afterMap = new mapboxgl.Map({
    container: 'after',
    style: 'mapbox://styles/mapbox/light-v11',
    center: NY_STATE,
    zoom: 6
});

// A selector or reference to HTML element
const container = '#comparison-container';

const map = new mapboxgl.Compare(beforeMap, afterMap, container, {
    // Set this to enable comparing two maps by mouse movement:
    // mousemove: true
});


const search_bar = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    zoom: 13
})

// add the geocoder
afterMap.addControl(
    search_bar
);

// add navigation controls
afterMap.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

beforeMap.on('load', () => {
    beforeMap.addSource('gun-violence-NY', {
        type: 'geojson',
        data: './data/gun-violence-NY-2014-2017.geojson',
    });

    beforeMap.addLayer({
        id: 'Gun Violence Incident',
        type: 'circle',
        source: 'gun-violence-NY',
        paint: {
            'circle-color': '#E52521', //red
            'circle-radius': 4,
            'circle-opacity': .5
        }
    });

    beforeMap.on('click', 'Gun Violence Incident', (e) => {
        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
                    <table class="key-value-table">
                        <tr>
                            <td class="key">Date</td>
                            <td class="value">${e.features[0].properties.date}</td>
                        </tr>
                        <tr>
                            <td class="key">Location</td>
                            <td class="value">${e.features[0].properties.city_or_county}</td>
                        </tr>
                        <tr>
                            <td class="key"> Killed | Injured</td>
                            <td class="value">${e.features[0].properties.n_killed} | ${e.features[0].properties.n_injured}</td>
                        </tr>
                        <tr>
                            <td class="key">Notes</td>
                            <td class="value">${e.features[0].properties.incident_characteristics}</td>
                        </tr>
                        <tr>
                            <td class="key">More Info</td>
                            <td class="value">
                                <a href="${e.features[0].properties.incident_url}" target="_blank">Incident ${e.features[0].properties.incident_id} URL</a>,
                                <a href="${e.features[0].properties.source_url}" target="_blank">Source URL</a>
                            </td>
                        </tr>
                    </table>
                    `)
            .addTo(beforeMap);
    });

});
