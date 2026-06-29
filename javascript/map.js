import { updateProfilePicture } from "./helper.js";
import { createLocationAndPutInBackend, deleteLocationFromBackend, editLocationAndPutInBackend, locationByIdFromBackend, locationsOfUser, queryFromBackend } from "./location.js";
import { clearSelectedMedia, resetMediaState, setSelectedMedia } from "./media-state.js";
import { showToast } from "./toast.js";
import { getLoggedInUser, logoutUser, queryUsersFromBackend, users } from "./user.js";

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
let isOverExistingPin = false; // true while the cursor is over a real marker

const pinPreview = document.getElementById("pin-preview");
const mapContainer = document.getElementById("map-container");
const nameElement = document.getElementById("location-name-input");
const descriptionElement = document.getElementById("location-description-input");
const feederListEl = document.querySelector(".feeder-list");
const input = document.getElementById("location-file-input");
const label = document.getElementById("location-upload-label");

const originalLabelHTML = label.innerHTML;

input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedMedia(file);

    const url = URL.createObjectURL(file);

    if (file.type.startsWith("image/")) {
        label.innerHTML = `
            <img
                src="${url}"
                class="location-media-image"
                onerror="this.onerror=null; this.src='https://res.cloudinary.com/dukionlns/image/upload/v1782661641/NoFileFound_hnqkoh.png';"
            >
        `;
    }

    else if (file.type.startsWith("video/")) {
        label.innerHTML = `
            <video class="location-media-video" controls
                onerror="this.outerHTML='<img class=&quot;location-media-image&quot; src=&quot;https://res.cloudinary.com/dukionlns/image/upload/v1782661641/NoFileFound_hnqkoh.png&quot;>';">
                <source src="${url}">
            </video>
        `;
    }

    else {
        label.innerHTML = `
            <img
                src="https://res.cloudinary.com/dukionlns/image/upload/v1782661641/NoFileFound_hnqkoh.png"
                class="location-media-image"
            >
        `;
    }
});

document.getElementById("location-input-remove-media").addEventListener("click", () => {
    clearSelectedMedia();
    input.value = "";
    label.innerHTML = originalLabelHTML;
});

document.addEventListener("click", (e) => {
    const logoutBtn = e.target.closest(".logout-button, .logout-button-mobile");
    if (!logoutBtn) return;

    logoutUser();
});

async function Main() {
    initMap();
    await retrieveLocations();
    renderExistingPins();
    updateProfilePicture();

    // Attach form modal action handlers
    document.querySelector(".cancel-button").addEventListener("click", () => toggleModal());
    document.querySelector(".confirm-button").addEventListener("click", () => confirmLocation());
    document.querySelector(".delete-button").addEventListener("click", () => deleteLocation());
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
            // Don't show the preview pin (or hide the cursor) while
            // hovering an existing marker — that marker already has
            // its own pointer cursor via the over-pin class.
            if (isOverExistingPin) return;

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
        // Closing
        overlay.classList.remove("is-open");

        setTimeout(() => {
            overlay.style.display = "none";

            // ✅ reset ONLY when fully closed
            currentEditingLocationId = null;

            // optional: also clear form state here
            nameElement.value = "";
            descriptionElement.value = "";
            resetMediaState();
        }, 200);
    } else {
        overlay.style.display = "flex";

        const modalHeader = document.getElementById("modal-header");
        modalHeader.innerHTML = `<span>Create new location</span><span class="coords">Lat: ${location ? location.lat.toFixed(4) : lat.toFixed(4)}, Lng: ${location ? location.lat.toFixed(4) : lng.toFixed(4)}</span>`;

        // 🔥 ALWAYS reset media FIRST
        resetMediaState();
        input.value = "";
        label.innerHTML = originalLabelHTML;

        requestAnimationFrame(() => {
            overlay.classList.add("is-open");
        });

        renderLocationMedia();
    }

    if (location) {
        nameElement.value = location.location_name;
        descriptionElement.value = location.description;
        if (location.feeders) {
            renderFeeders()
        } else {

        }
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
        if (updatedLocation) {
            const marker = markerMap.get(currentEditingLocationId);

            if (!marker) return;

            // update position
            marker.setLatLng([updatedLocation.lat, updatedLocation.lng]);

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
        }
    } else {

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

        attachMarkerHoverHandlers(newLocationMarker);
        attachMarkerEditHandler(newLocationMarker, newLocationMarker.id, newLocation);

        console.log("Created new marker:", newLocation.id);
        toggleModal()
        resetMediaState();
        input.value = "";
        label.innerHTML = originalLabelHTML;
        currentEditingLocationId = null;
    }
}

async function deleteLocation() {
    if (!currentEditingLocationId) {
        showToast("No location selected to delete.", "map");
        return;
    }

    const realId = Number(currentEditingLocationId.replace("marker-", ""));

    try {
        // delete from backend
        await deleteLocationFromBackend(realId);

        // delete marker from map
        const marker = markerMap.get(currentEditingLocationId);

        if (marker) {
            mapInstance.removeLayer(marker);
            markerMap.delete(currentEditingLocationId);
        }

        // remove from local array if you keep one

        currentEditingLocationId = null;
        toggleModal();

    } catch (err) {
        console.error("Failed to delete location:", err);
        alert("Failed to delete location.");
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

// Hides/cancels the idle pin-preview and flags that the cursor is over
// a real marker, so the map's mousemove handler won't draw the preview
// pin (or hide the system cursor) on top of an existing pin.
function attachMarkerHoverHandlers(marker) {
    marker.on("mouseover", () => {
        isOverExistingPin = true;
        clearTimeout(idleTimer);
        pinPreview.style.display = "none";
        mapContainer.classList.remove("pin-ready");
        mapContainer.classList.add("over-pin");
    });

    marker.on("mouseout", () => {
        isOverExistingPin = false;
        mapContainer.classList.remove("over-pin");
    });
}

// Opens the edit modal for a marker on double-click. Shared between
// renderExistingPins() (locations loaded from the backend) and
// confirmLocation()'s create branch (a pin just placed this session),
// so a freshly created pin is immediately editable without a refresh.
function attachMarkerEditHandler(marker, markerId, loc) {
    marker.on("dblclick", () => {
        if (!markerClickEnabled) return;

        currentEditingLocationId = markerId;
        toggleModal(loc.lat, loc.lng, loc);
    });
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

        attachMarkerHoverHandlers(marker);
        attachMarkerEditHandler(marker, markerId, loc);
    });
}

function getMarkerById(id) {
    return markerMap.get(id);
}

async function renderFeeders() {
    if (currentEditingLocationId) {
        const realId = Number(currentEditingLocationId.replace("marker-", ""));
        const location = locationsOfUser.find(loc => loc.id === realId)
        const users = await queryUsersFromBackend();
        feederListEl.innerHTML = location.feeders.map(userId => {
            const user = users.find(u => u.id === userId);
            if (!user) return "";

            const className =
                userId === location.owner_id
                    ? "owner"
                    : "feeder";

            return `
        <div class="location-${className}" data-id="${user.id}">
        <img src="${user.profile_pic_url}" class="feeder-logo"/>
        <span>${user.username}</span>
        </div>
        `;
        })
            .join("");
    }
}

async function renderLocationMedia() {
    // 🔥 ALWAYS start clean
    label.innerHTML = originalLabelHTML;

    if (currentEditingLocationId) {
        const realId = Number(currentEditingLocationId.replace("marker-", ""));
        const location = locationsOfUser.find(loc => loc.id === realId);

        const fileUrl = location.location_media_url;

        if (!fileUrl) return;

        if (location.media_type === "image") {
            label.innerHTML = `<img src="${fileUrl}" class="location-media-image">`;
        }

        else if (location.media_type === "video") {
            label.innerHTML = `
                <video class="location-media-video" controls>
                    <source src="${fileUrl}">
                </video>
            `;
        }
    }
}