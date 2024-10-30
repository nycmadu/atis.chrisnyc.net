const airportSelect = document.getElementById('airportSelect');
const airportCodeElement = document.getElementById('airport-code');
const atisOutput = document.getElementById('atisOutput');
const updateTimeElement = document.getElementById('update-time');
const newUpdateAlert = document.getElementById('newUpdateAlert');
const refreshBtn = document.getElementById('refreshBtn');
const vpnWarning = document.getElementById('vpnWarning');  // VPN Warning Element

let loadedAirports = [];
let lastATISTime = null;
let latestData = '';
const refreshInterval = 60000;

// Helper to Parse Time Difference
function calculateTimeDiff(timestamp) {
    const currentTime = new Date();
    const lastTime = new Date(timestamp);
    const diff = Math.round((currentTime - lastTime) / 60000);
    updateTimeElement.textContent = diff <= 0 ? 'just now' : `${diff} min`;
}

// Show VPN Warning Popup for 3 seconds
function showVPNWarning() {
    vpnWarning.style.display = 'block';  // Show warning
    vpnWarning.classList.add('fade-in');

    // Hide after 3 seconds with a fade out
    setTimeout(() => {
        vpnWarning.classList.remove('fade-in');
        vpnWarning.classList.add('fade-out');

        setTimeout(() => {
            vpnWarning.style.display = 'none';
            vpnWarning.classList.remove('fade-out');
        }, 1000); // After fade-out delay
    }, 3000);  // Show for 3 seconds
}

// Fetch ATIS data
function fetchATIS(airport) {
    const apiUrl = `https://datis.clowd.io/api/${airport}`;
    
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error('API blocked or VPN in use');
            return response.json();
        })
        .then(data => {
            const atis = data.length > 0 ? data[0] : null;
            if (atis) {
                lastATISTime = new Date();
                calculateTimeDiff(lastATISTime);
                airportCodeElement.textContent = `D-ATIS for ${airport}`;
                
                // New ATIS Data
                if (atis.datis !== latestData) {
                    latestData = atis.datis;
                    atisOutput.textContent = latestData;
                    newUpdateAlert.hidden = false;  // Show new update alert
                } else {
                    newUpdateAlert.hidden = true;
                }
            }
        })
        .catch(error => {
            console.error('Error fetching ATIS:', error);
            atisOutput.textContent = 'Unable to fetch ATIS data. Try again later.';
            showVPNWarning();  // Show VPN warning on failure
        });
}

// Populate Airport Dropdown
fetch('https://datis.clowd.io/api/stations')
    .then(response => {
        if (!response.ok) throw new Error('API blocked or VPN in use');
        return response.json();
    })
    .then(data => {
        loadedAirports = data;
        data.forEach(airport => {
            const option = document.createElement('option');
            option.value = airport;
            option.textContent = airport;
            airportSelect.appendChild(option);
        });

        const ICAOFromURL = window.location.pathname.substring(1).toUpperCase();
        if (ICAOFromURL && loadedAirports.includes(ICAOFromURL)) {
            airportSelect.value = ICAOFromURL;
            fetchATIS(ICAOFromURL);
        }
    })
    .catch(error => {
        console.error('Error fetching airport list:', error);
        showVPNWarning();  // Show VPN warning on failure
    });

// Refresh ATIS Data on button click
refreshBtn.addEventListener('click', () => {
    const selectedAirport = airportSelect.value;
    if (selectedAirport) {
        fetchATIS(selectedAirport);
    }
});

// Fetch ATIS on Dropdown Selection
airportSelect.addEventListener('change', () => {
    const selectedAirport = airportSelect.value;
    if (selectedAirport) {
        window.history.pushState({}, '', `/${selectedAirport}`);
        fetchATIS(selectedAirport);
    }
});

// Auto-refresh every 60 seconds
setInterval(() => {
    const selectedAirport = airportSelect.value;
    if (selectedAirport) {
        fetchATIS(selectedAirport);
    }
}, refreshInterval);