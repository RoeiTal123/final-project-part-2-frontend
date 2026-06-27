import { showToast } from "./toast.js"
import { generateId, uploadToCloudinary } from "./helper.js"
import { saveArrayToStorage, getArrayFromStorage } from "./helper.js"
import { httpService } from "./communication.js";
import { currentSelectedLat, currentSelectedLng } from "./map.js";
import { selectedMediaFile, selectedMediaType, clearSelectedMedia, resetMediaState } from "./media-state.js";
import { renderExistingPins } from "./map.js"
import { getLoggedInUser } from "./user.js";

let userId = "4"

export let locationsOfUser = []

const nameElement = document.getElementById("location-name-input")
const descriptionElement = document.getElementById("location-description-input")

export async function queryFromBackend(value = "") {
    try {
        const res = await httpService.get(
            "locations",
            { user_id: value }
        );

        console.log("BACKEND LOCATIONS: ", res);

        locationsOfUser = res;
        return res;

    } catch (err) {
        console.log("Backend query failed: ", err);
        return null;
    }
}

export async function locationByIdFromBackend(locationId) {
    try {
        const location = await httpService.get(`locations/${locationId}`, "GET");

        console.log("BACKEND LOCATION: ", location);

        return location;

    } catch (err) {
        console.log("Backend query failed: ", err);
        return null;
    }
}

export async function createLocationAndPutInBackend() {
    const nameEl = document.getElementById("location-name-input")
    const descEl = document.getElementById("location-description-input")

    const name = nameEl.value.trim()
    const desc = descEl.value.trim()

    const loggedUser = getLoggedInUser()

    if (!name) {
        showToast("missing name", "map");
        return;
    }

    if (!desc) {
        showToast("missing description", "map");
        return;
    }

    let mediaUrl = null;
    let mediaType = null;

    if (selectedMediaFile) {
        try {
            const upload = await uploadToCloudinary(selectedMediaFile);

            mediaUrl = upload.url;
            mediaType = selectedMediaType;

        } catch (err) {
            console.log("upload failed:", err);
            showToast("media upload failed, posting without media", "map");

            mediaUrl = null;
            mediaType = null;
        }
    }

    const newLocation = {
        location_name: name,
        lat: currentSelectedLat,
        lng: currentSelectedLng,
        description: desc,
        media_type: mediaType,
        location_media_url: mediaUrl,
        owner_id: Number(loggedUser.id),
        feeders: [Number(loggedUser.id)],
        created_at: Date.now()
    };

    try {
        const createdLocation = await httpService.post(
            "locations",
            newLocation
        );

        console.log("CREATED LOCATION: ", createdLocation);
        locationsOfUser.push(newLocation)
        renderExistingPins(locationsOfUser)
        showToast(`created location`, "map");

        nameEl.value = "";
        descEl.value = "";
        resetMediaState();

        return createdLocation;
    }
    catch (err) {
        console.log("Backend create failed: ", err);
        return null;
    }
}

export async function editLocationAndPutInBackend(locationId) {

    const locationName = nameElement.value.trim()
    const locationDescription = descriptionElement.value.trim()

    if (locationName === "") {
        showToast("invalid name", "map")
        return
    }

    if (locationDescription === "") {
        showToast("invalid description", "map")
        return
    }

    console.log(locationsOfUser)
    console.log(locationId)
    const originalIndex = locationsOfUser.findIndex(l => l.id === locationId);
    if (originalIndex === -1) return null;

    const originalLocation = locationsOfUser[originalIndex];

    // nothing changed check

    const mediaWasOriginallyPresent = !!originalLocation.location_media_url;

    const mediaReplaced = selectedMediaFile !== null;

    const mediaRemoved =
        selectedMediaFile === null &&
        selectedMediaType === "none" &&
        mediaWasOriginallyPresent;

    const mediaChanged = mediaRemoved || mediaReplaced;


    if (
        originalLocation.location_name === locationName &&
        originalLocation.description === locationDescription &&
        !mediaChanged
    ) {
        showToast("nothing changed, not saving", "map");
        return null;
    }

    let mediaUrl = originalLocation.location_media_url;
    let mediaType = originalLocation.media_type;

    if (selectedMediaFile) {
        try {
            const upload = await uploadToCloudinary(selectedMediaFile);

            mediaUrl = upload.url;
            mediaType = selectedMediaType;

        } catch (err) {
            console.log("upload failed:", err);
            showToast("media upload failed, keeping old media", "map");
        }
    }

    if (
        selectedMediaFile === null &&
        selectedMediaType === "none" &&
        originalLocation.location_media_url
    ) {
        mediaUrl = null;
        mediaType = null;
    }

    // copy + overwrite
    const updatedLocation = {
        ...originalLocation,
        location_name: locationName,
        description: locationDescription,
        lat: originalLocation.lat,   // 🔥 FORCE PRESERVE
        lng: originalLocation.lng,
        location_media_url: mediaUrl,
        media_type: mediaType
    };


    try {
        await httpService.put(`locations/${locationId}`, updatedLocation);

        showToast(`updated location [${locationId}]`, "map");

        nameElement.value = "";
        descriptionElement.value = "";
        locationsOfUser[originalIndex] = { ...updatedLocation };
        renderExistingPins();
        return updatedLocation;
    }
    catch (err) {
        console.log("backend update failed: ", err);

        // rollback
        locationsOfUser[originalIndex] = originalLocation;

        showToast("update failed", "map");
        return null;
    }
}

export async function deleteLocationFromBackend(locationId) {
    const locationid = Number(locationId)
    const loggedUser = getLoggedInUser();

    if (!locationId) {
        showToast("invalid location", "map");
        return;
    }

    const locations = await queryFromBackend();
    console.log(locations)
    const location = locations.find(l => {
        return l.id === locationId
    });

    if (!location) {
        showToast("location not found", "map");
        return;
    }

    if (location.owner_id !== loggedUser.id) {
        showToast("not allowed", "map");
        return;
    }

    try {
        const res = await httpService.delete(`locations/${locationId}`)

        locationsOfUser = locationsOfUser.filter(l => l.id !== locationId);
        console.log("DELETED LOCATION: ", res.data)
        showToast(`deleted location [${locationId}]`, "map");

        return res.data
    }
    catch (err) {
        console.log("Backend create failed: ", err)
        return null
    }
}

export async function theLocations() {
    if (!locationsOfUser) return null
    return locationsOfUser;
}