import { updateProfilePicture } from "./helper";
import { createLocationAndPutInBackend, deleteLocationFromBackend, locationByIdFromBackend, locationsOfUser, queryFromBackend } from "./location";
import { showToast } from "./toast";
import { getLoggedInUser } from "./user";

document.addEventListener("DOMContentLoaded", Main);

// State tracking variables
let mapInstance; 
export let currentSelectedLat = 0;
export let currentSelectedLng = 0;
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
// const locations = [
//     {
//         id: 1, 
//         locationName: "Main Sanctuary", 
//         lat: 51.505, 
//         lng: -0.09, 
//         descriptionName: "Main feeding zone",
//         locationMediaUrl: null,
//         feeders: [2], 
//         ownerid: 1
//     }
// ];

// const locations = [
//     {
//         locationName: "Thames Riverside Feed Point",
//         lat: 51.507,
//         lng: -0.087,
//         index: 120,
//         descriptionName: "Cats gather near benches by the river",
//         locationMediaUrl: null,
//         feeders: [1, 2],
//         ownerid: 1
//     },
//     {
//         locationName: "Camden Alley Feeding Spot",
//         lat: 51.542,
//         lng: -0.142,
//         index: -85,
//         descriptionName: "Quiet alley behind market stalls",
//         locationMediaUrl: null,
//         feeders: [2, 3, 1],
//         ownerid: 2
//     },
//     {
//         locationName: "Hyde Park Corner Station Area",
//         lat: 51.503,
//         lng: -0.152,
//         index: 310,
//         descriptionName: "Near park entrance benches",
//         locationMediaUrl: null,
//         feeders: [3],
//         ownerid: 3
//     },
//     {
//         locationName: "Shoreditch Street Feed Zone",
//         lat: 51.524,
//         lng: -0.078,
//         index: -220,
//         descriptionName: "Behind street art wall",
//         locationMediaUrl: null,
//         feeders: [3, 4],
//         ownerid: 4
//     },
//     {
//         locationName: "Greenwich Park Feeding Hill",
//         lat: 51.476,
//         lng: -0.001,
//         index: 450,
//         descriptionName: "Hilltop feeding with city view",
//         locationMediaUrl: null,
//         feeders: [1, 4, 2],
//         ownerid: 1
//     },
//     {
//         locationName: "Soho Backstreet Cats Corner",
//         lat: 51.513,
//         lng: -0.131,
//         index: -40,
//         descriptionName: "Small corner between restaurants",
//         locationMediaUrl: null,
//         feeders: [2],
//         ownerid: 2
//     },
//     {
//         locationName: "Battersea Park Feeding Bench",
//         lat: 51.479,
//         lng: -0.163,
//         index: 275,
//         descriptionName: "Near lake-side benches",
//         locationMediaUrl: null,
//         feeders: [3, 1],
//         ownerid: 3
//     },
//     {
//         locationName: "King’s Cross Quiet Wall Spot",
//         lat: 51.531,
//         lng: -0.123,
//         index: -310,
//         descriptionName: "Behind station service wall",
//         locationMediaUrl: null,
//         feeders: [4, 2, 1],
//         ownerid: 4
//     },
//     {
//         locationName: "Notting Hill Garden Edge",
//         lat: 51.509,
//         lng: -0.205,
//         index: 95,
//         descriptionName: "Residential garden side feeding area",
//         locationMediaUrl: null,
//         feeders: [1],
//         ownerid: 1
//     },
//     {
//         locationName: "Regent’s Canal Feeding Path",
//         lat: 51.537,
//         lng: -0.093,
//         index: -480,
//         descriptionName: "Along canal walking path",
//         locationMediaUrl: null,
//         feeders: [2, 3, 4, 1],
//         ownerid: 2
//     }
// ];

const nameElement = document.getElementById("location-name-input");
const descriptionElement = document.getElementById("location-description-input");

async function Main() {
    initMap();
    await retrieveLocations();
    renderExistingPins();
    updateProfilePicture();

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

async function retrieveLocations(){
    const loggedInUser = getLoggedInUser();
    const user_id = loggedInUser.id;
    const locations = await queryFromBackend(user_id);
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

    if (overlay.classList.contains('is-open')) {
        // Closing: animate out, then hide after the transition finishes
        overlay.classList.remove('is-open');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 200); // matches the 0.2s transition duration
    } else {
        // Opening: show first, then add the class on the next frame so the transition triggers
        overlay.style.display = 'flex';

        const modalHeader = document.getElementById("modal-header");
        modalHeader.innerHTML = `<span>Create new location</span><span class="coords">Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}</span>`;

        requestAnimationFrame(() => {
            overlay.classList.add('is-open');
        });
    }

    nameElement.value = "";
    descriptionElement.value = "";
}

function confirmLocation() {
    const newLocation = createLocationAndPutInBackend();
    if(!newLocation){
        toggleModal();
        // Program step logic: Save coordinates directly onto our map instance layer array view
        const newLocationMarker = L.marker([currentSelectedLat, currentSelectedLng]).addTo(mapInstance);
        
        // Bind an integrated popup bubble overlay info context directly onto the pin marker node
        newLocationMarker.bindPopup(`<b>${newLocation.location_name}</b><br>${newLocation.description}`).openPopup();

        console.log("New tracking location data successfully rendered onto system layout maps:", currentSelectedLat, currentSelectedLng);
    }
}

export function renderExistingPins() {
    // Loop through your database records collection to mount existing array structures
    locationsOfUser.forEach(loc => {
        const marker = L.marker([loc.lat, loc.lng]).addTo(mapInstance);
        marker.bindPopup(`<b>${loc.location_name}</b><br>${loc.description}`);
    });
}
