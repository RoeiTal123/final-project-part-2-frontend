import { showToast } from "./toast";

document.addEventListener("DOMContentLoaded", Main);

let mapInstance; 
let currentSelectedLat = 0;
let currentSelectedLng = 0;
let userId = 4;

// Mock database entries (Using Lat / Lng instead of custom grid pixel metrics)
const locations = [
    {
        id: 1, 
        locationName: "Main Sanctuary", 
        coords: { lat: 51.505, lng: -0.09 }, 
        descriptionName: "Main feeding zone",
        Feeders: [2], 
        ownerid: 1
    }
];

const nameElement = document.getElementById("location-name-input");
const descriptionElement = document.getElementById("location-description-input");

function Main() {
    initMap();
    renderExistingPins();

    // Attach form modal action handlers
    document.querySelector(".cancel-button").addEventListener("click", () => toggleModal());
    document.querySelector(".confirm-button").addEventListener("click", confirmLocation);
}

function initMap() {
    // Instantiate the main engine system
    mapInstance = L.map('map-container', {
        minZoom: 2,
        maxZoom: 18,
        zoomControl: true
    }).setView([51.505, -0.09], 14); // Set the initial center coordinate focus point

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(mapInstance);

    // REFLOW TRICK: Tells the map engine to recalculate container space right after the layout structures paint
    setTimeout(() => {
        mapInstance.invalidateSize();
    }, 100);

    // Hook into Leaflet's contextual click capture event pipeline
    mapInstance.on('click', handleMapClick);
}

function handleMapClick(e) {
    // Leaflet isolates context automatically: this only runs if the user didn't drag!
    currentSelectedLat = e.latlng.lat;
    currentSelectedLng = e.latlng.lng;

    toggleModal(currentSelectedLat, currentSelectedLng);
}

function toggleModal(lat, lng) {
    const overlay = document.getElementById('modal-overlay');

    if (overlay.style.display === 'flex') {
        overlay.style.display = 'none';
    } else {
        overlay.style.display = 'flex';
        
        // Update form layout modal header coordinates view
        const modalHeader = document.getElementById("modal-header");
        modalHeader.innerHTML = `<span>Create new location</span><span class="coords">Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}</span>`;
    }

    nameElement.value = "";
    descriptionElement.value = "";
}

function confirmLocation() {
    const name = nameElement.value.trim();
    const description = descriptionElement.value.trim();

    if (!name) {
        showToast("Please enter a location name.");
        return;
    }

    // Program step logic: Save coordinates directly onto our map instance layer array view
    const newLocationMarker = L.marker([currentSelectedLat, currentSelectedLng]).addTo(mapInstance);
    
    // Bind an integrated popup bubble overlay info context directly onto the pin marker node
    newLocationMarker.bindPopup(`<b>${name}</b><br>${description}`).openPopup();

    toggleModal();
    console.log("New tracking location data successfully rendered onto system layout maps:", currentSelectedLat, currentSelectedLng);
}

function renderExistingPins() {
    // Loop through your database records collection to mount existing array structures
    locations.forEach(loc => {
        const marker = L.marker([loc.coords.lat, loc.coords.lng]).addTo(mapInstance);
        marker.bindPopup(`<b>${loc.locationName}</b><br>${loc.descriptionName}`);
    });
}
