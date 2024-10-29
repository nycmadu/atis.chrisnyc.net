const airportSelect = document.getElementById('airportSelect');
const airportCodeElement = document.getElementById('airport-code');
const atisOutput = document.getElementById('atisOutput');
const updateTimeElement = document.getElementById('update-time');
const newUpdateAlert = document.getElementById('newUpdateAlert');
const refreshBtn = document.getElementById('refreshBtn');

// List of airports pulled from the API on load to populate the dropdown.
let loadedAirports = [];

// Global variables
let lastATISTime = null;
let latestData = '';
const refreshInterval = 60000;

// Handling dynamic ICAO code based on URL
function getAirportFromURL() {
    const path = window.location.pathname.substring(1).toUpperCase();
    if (loadedAirports.includes(path)) {
        return path;
    }
    return null; // No valid ICAO from URL
}

// Function to calculate the time difference (in minutes)
function calculateTimeDiff(timestamp) {
    const currentTime = new Date();
    const lastTime = new Date(timestamp);
    // Difference in minutes
    const diff = Math.round((currentTime - lastTime) / 60000);
    updateTimeElement.textContent = diff <= 0 ? 'just now' : `${diff} min`;
}

// Fetch the ATIS data and display it
function fetchATIS(airport) {
    const apiUrl = `https://datis.clowd.io/api/${airport}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const atis = data.length > 0 ? data[0] : null;
            if (atis) {
                lastATISTime = new Date();
                calculateTimeDiff(lastATISTime);

                airportCodeElement.textContent = `D-ATIS for ${airport}`;
                
                // Check if there's any new data
                if (atis.datis !== latestData) {
                    latestData = atis.datis;
                    atisOutput.textContent = latestData;
                    newUpdateAlert.hidden = false; // Show the new update alert
                } else {
                    newUpdateAlert.hidden = true;
                }
            }
        })
        .catch(error => {
            console.error('Error fetching ATIS:', error);
            atisOutput.textContent = 'Unable to fetch ATIS data. Try again later.';
        });
}

// Populating the dropdown with airport options from the API
fetch('https://datis.clowd.io/api/stations')
    .then(response => response.json())
    .then(data => {
        loadedAirports = data;
        data.forEach(airport => {
            const option = document.createElement('option');
            option.value = airport;
            option.textContent = airport;
            airportSelect.appendChild(option);
        });

        // Check if the ICAO is specified in the URL
        const ICAOFromURL = getAirportFromURL();
        if (ICAOFromURL) {
            airportSelect.value = ICAOFromURL;
            fetchATIS(ICAOFromURL);
        }
    })
    .catch(error => console.error('Error fetching stations:', error));

// Refresh button to re-fetch the ATIS data
refreshBtn.addEventListener('click', () => {
    const selectedAirport = airportSelect.value;
    if (selectedAirport) {
        fetchATIS(selectedAirport);
    }
});

// Event listener on the dropdown to fetch data for selected airport
airportSelect.addEventListener('change', () => {
    const selectedAirport = airportSelect.value;
    if (selectedAirport) {
        window.history.pushState({}, '', `/${selectedAirport}`);  // Update URL without refreshing
        fetchATIS(selectedAirport);
    }
});

// Auto-refresh every refreshInterval
setInterval(() => {
    const selectedAirport = airportSelect.value;
    if (selectedAirport) {
        fetchATIS(selectedAirport);
    }
}, refreshInterval);