import { showToast } from "./toast";

document.addEventListener("DOMContentLoaded", Main);

// State tracking variables
let mapInstance; 
let currentSelectedLat = 0;
let currentSelectedLng = 0;
let userId = 4;

// Quick-click pin placement detection
const CLICK_TIME_LIMIT = 200;
let mouseDownTime = null;
let mouseDownPoint = null;
let hasMouseMoved = false;

// Idle-hover pin preview
const IDLE_READY_DELAY = 200; // ms — how long the mouse must sit still before showing the preview pin
let idleTimer = null;
const pinPreview = document.getElementById('pin-preview');
const mapContainer = document.getElementById('map-container');

// Mock database entries (Using Lat / Lng instead of custom grid pixel metrics)
const locations = [
    {
        id: 1, 
        locationName: "Main Sanctuary", 
        lat: 51.505, 
        lng: -0.09, 
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
    mapInstance = L.map('map-container', {
        minZoom: 2,
        maxZoom: 18,
        zoomControl: true
    }).setView([51.505, -0.09], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(mapInstance);

    setTimeout(() => {
        mapInstance.invalidateSize();
    }, 100);

    // Record when the press started (for the click-speed check)
    mapInstance.on('mousedown', () => {
        mouseDownTime = performance.now();
        hasMouseMoved = false;
    });

    // Idle-hover pin preview + movement tracking for the click-speed check
    mapInstance.on('mousemove', (e) => {
        hasMouseMoved = true;

        // Any movement hides the preview and restarts the idle countdown
        pinPreview.style.display = 'none';
        mapContainer.classList.remove('pin-ready');
        clearTimeout(idleTimer);

        const { x, y } = e.containerPoint;
        idleTimer = setTimeout(() => {
            pinPreview.style.left = `${x}px`;
            pinPreview.style.top = `${y}px`;
            pinPreview.style.display = 'block';
            mapContainer.classList.add('pin-ready');
        }, IDLE_READY_DELAY);
    });

    mapInstance.on('mouseout', () => {
        clearTimeout(idleTimer);
        pinPreview.style.display = 'none';
        mapContainer.classList.remove('pin-ready');
    });

    mapInstance.on('click', handleMapClick);
}

function handleMapClick(e) {
    if (mouseDownTime === null) return; // safety guard

    const elapsed = performance.now() - mouseDownTime;
    const wasFastEnough = elapsed < CLICK_TIME_LIMIT;
    const wasStillEnough = !hasMouseMoved;

    // Reset state for next interaction
    mouseDownTime = null;
    mouseDownPoint = null;
    hasMouseMoved = false;

    if (!wasFastEnough || !wasStillEnough) {
        return; // too slow or moved — don't place a pin
    }

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
        const marker = L.marker([loc.lat, loc.lng]).addTo(mapInstance);
        marker.bindPopup(`<b>${loc.locationName}</b><br>${loc.descriptionName}`);
    });
}
