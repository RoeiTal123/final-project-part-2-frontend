import { updateProfilePicture } from "./helper.js";
import { createLocationAndPutInBackend, deleteLocationFromBackend, editLocationAndPutInBackend, locationByIdFromBackend, locationsOfUser, queryFromBackend } from "./location.js";
import { showToast } from "./toast.js";
import { getLoggedInUser } from "./user.js";

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
let markerClickEnabled = true;
let currentEditingLocationId;
const markerMap = new Map();

// Idle-hover pin preview
const IDLE_READY_DELAY = 200; // ms — how long the mouse must sit still before showing the preview pin
let idleTimer = null;

const pinPreview = document.getElementById("pin-preview");
const mapContainer = document.getElementById("map-container");
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
    mapInstance = L.map("map-container", {
        minZoom: 2,
        maxZoom: 18,
        zoomControl: true
    }).setView([51.505, -0.09], 14);

    mapInstance.doubleClickZoom.disable();

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(mapInstance);

    setTimeout(() => {
        mapInstance.invalidateSize();
    }, 100);

    // Record when the press started (for the click-speed check)
    mapInstance.on("mousedown", () => {
        mouseDownTime = performance.now();
        hasMouseMoved = false;
    });

    // Idle-hover pin preview + movement tracking for the click-speed check
    mapInstance.on("mousemove", (e) => {
        hasMouseMoved = true;

        // Any movement hides the preview and restarts the idle countdown
        pinPreview.style.display = "none";
        mapContainer.classList.remove("pin-ready");
        clearTimeout(idleTimer);

        const { x, y } = e.containerPoint;
        idleTimer = setTimeout(() => {
            pinPreview.style.left = `${x}px`;
            pinPreview.style.top = `${y}px`;
            pinPreview.style.display = "block";
            mapContainer.classList.add("pin-ready");
        }, IDLE_READY_DELAY);
    });

    mapInstance.on("mouseout", () => {
        clearTimeout(idleTimer);
        pinPreview.style.display = "none";
        mapContainer.classList.remove("pin-ready");
    });

    mapInstance.on("click", handleMapClick);
}

async function retrieveLocations() {
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

function toggleModal(lat, lng, location = null) {
    const overlay = document.getElementById("modal-overlay");

    if (overlay.classList.contains("is-open")) {
        // Closing: animate out, then hide after the transition finishes
        overlay.classList.remove("is-open");
        setTimeout(() => {
            overlay.style.display = "none";
        }, 200); // matches the 0.2s transition duration
    } else {
        // Opening: show first, then add the class on the next frame so the transition triggers
        overlay.style.display = "flex";

        const modalHeader = document.getElementById("modal-header");
        modalHeader.innerHTML = `<span>Create new location</span><span class="coords">Lat: ${location ? location.lat.toFixed(4) : lat.toFixed(4)}, Lng: ${location ? location.lat.toFixed(4) : lng.toFixed(4)}</span>`;

        requestAnimationFrame(() => {
            overlay.classList.add("is-open");
        });
    }

    if (location) {
        console.log(location)
        nameElement.value = location.location_name;
        descriptionElement.value = location.description;
    } else {

        nameElement.value = "";
        descriptionElement.value = "";
    }

}

async function confirmLocation() {


    // =========================
    // EDIT EXISTING LOCATION
    // =========================
    if (currentEditingLocationId) {
        const realId = currentEditingLocationId.replace("marker-", "");
        const updatedLocation = await editLocationAndPutInBackend(Number(realId))
        console.log(updatedLocation)
        const marker = markerMap.get(currentEditingLocationId);

        if (!marker) return;

        // update position
        marker.setLatLng([currentSelectedLat, currentSelectedLng]);

        // update popup
        marker.setPopupContent(
            `<b>${updatedLocation.location_name}</b><br>${updatedLocation.description}`
        );

        // update stored data
        marker.loc = updatedLocation;

        console.log("Edited marker:", currentEditingLocationId);

        currentEditingLocationId = null; // reset edit mode
        toggleModal()
        return;
    }  else {

        const newLocation = await createLocationAndPutInBackend();
        
            // =========================
            // CREATE NEW LOCATION
            // =========================
            const newLocationMarker = L.marker([currentSelectedLat, currentSelectedLng]).addTo(mapInstance);
        
            newLocationMarker.bindPopup(
                `<b>${newLocation.location_name}</b><br>${newLocation.description}`
            ).openPopup();
        
            newLocationMarker.id = `marker-${newLocation.id}`;
            newLocationMarker.loc = newLocation;
        
            markerMap.set(newLocationMarker.id, newLocationMarker);
        
            console.log("Created new marker:", newLocation.id);
            toggleModal()
    }
}

export function setMarkerClickEnabled(state) {
    markerClickEnabled = state;
}


export function clearExistingPins() {
    markerMap.forEach(marker => {
        mapInstance.removeLayer(marker);
    });

    markerMap.clear();
}

export function renderExistingPins() {
    // Loop through your database records collection to mount existing array structures
    clearExistingPins();

    markerMap.clear();
    console.log(locationsOfUser)

    locationsOfUser.forEach(loc => {
        const marker = L.marker([loc.lat, loc.lng]).addTo(mapInstance);
        marker.bindPopup(`<b>${loc.location_name}</b><br>${loc.description}`);
        const markerId = `marker-${loc.id}`;
        marker.id = markerId
        marker.loc = { ...loc };
        markerMap.set(markerId, marker);

        marker.on("dblclick", (e) => {
            if (!markerClickEnabled) return;

            currentEditingLocationId = markerId;
            toggleModal(loc.lat, loc.lng, loc);
        });
    });
}

function getMarkerById(id) {
    return markerMap.get(id);
}
