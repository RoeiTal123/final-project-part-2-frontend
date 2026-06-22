import { showToast } from './toast.js'
import { generateId } from './helper.js'
import { saveArrayToStorage, getArrayFromStorage } from '../javascript/helper.js'
import { httpService } from "./communication.js";
import { getIndexs } from './map.js';

let userId = "4"

let locations = []

const nameElement = document.getElementById("location-name-input")
const descriptionElement = document.getElementById("location-description-input")

export async function queryFromBackend(value = "") {
    try {
        const res = await httpService.get(
            "locations"
        );

        console.log("🔥 BACKEND LOCATIONS:", res);

        locations = res;
        return res;

    } catch (err) {
        console.log("❌ Backend query failed:", err);
        return null;
    }
}

export async function locationByIdFromBackend(locationId) {
    try {
        const location = await httpService.get(`locations/${locationId}`, "GET");

        console.log("🔥 BACKEND LOCATION:", location);

        return location;

    } catch (err) {
        console.log("❌ Backend query failed:", err);
        return null;
    }
}

export async function createLocationAndPutInBackend() {

    const locationName = nameElement.value.trim()
    const locationDescription = descriptionElement.value.trim()
    const indexs = getIndexs()

    if (locationName === "") {
        showToast("invalid name", "map")
        return
    }

    if (locationDescription === "") {
        showToast("invalid description", "map")
        return
    }

    if (x === NaN || y === NaN) {
        showToast("invalid coardinats", "map")
        return
    }



    const newLocation = {
        id: generateId(), name: locationName, indexs: { x: x, y: y },
        description: locationDescription, locationImageURL: "",
        Feeders: [], ownerid: userId, createdAt: Date.now()
    };

    try {
        const createdLocation = await httpService.post(
            "locations",
            newLocation
        );

        console.log("🔥 CREATED LOCATION:", createdLocation);
        locations.push(newLocation)
        showToast(`created location [${newLocation.id}]`, "main");

        nameElement.value = ""
        descriptionElement.value = ""

        return createdLocation;
    }
    catch (err) {
        console.log("❌ Backend create failed:", err);
        return null;
    }
}

export async function editLocationAndPutInBackend(locationId) {

    const locationName = nameElement.value.trim()
    const locationDescription = descriptionElement.value.trim()
    const indexs = getIndexs()

    if (locationName === "") {
        showToast("invalid name", "map")
        return
    }

    if (locationDescription === "") {
        showToast("invalid description", "map")
        return
    }

    if (x === NaN || y === NaN) {
        showToast("invalid coardinats", "map")
        return
    }

    const originalIndex = locations.findIndex(p => p.id === locationId);
    if (originalIndex === -1) return null;

    const originalLocation = locations[originalIndex];

    // nothing changed check
    if (
        originalLocation.name === locationName &&
        originalLocation.description === locationDescription
    ) {
        showToast("nothing changed, not saving", "main");
        return null;
    }

    // copy + overwrite
    const updatedLocation = {
        ...originalLocation,
        name: locationName,
        description: locationDescription
    };

    // optimistic UI update
    locations[originalIndex] = {...updatedLocation};
    renderLocations(locations);

    showToast(`updated location [${locationId}]`, "main");

    // reset UI
    titleEl.value = "";
    descEl.value = "";

    try {
        await httpService.put(`locations/${locationId}`, updatedLocation);

        showToast(`updated location [${locationId}]`, "main");

        titleEl.value = "";
        descEl.value = "";

        return updatedLocation;
    }
    catch (err) {
        console.log("❌ Backend update failed:", err);

        // rollback
        locations[originalIndex] = originalLocation;
        renderLocations(locations);

        showToast("update failed", "main");
        return null;
    }
}

export async function deleteLocationFromBackend(locationId) {
    const userid = Number(userId)
    if (!locationId) {
        showToast("invalid location", "main");
        return;
    }

    const location = locations.find(p => {
        return p.id === locationId
    });

    if (!location) {
        showToast("location not found", "main");
        return;
    }

    if (location.user_id !== userid) {
        showToast("not allowed", "main");
        return;
    }


    try {
        const res = await httpService.delete(`locations/${locationId}`)

        locations = locations.filter(p => p.id !== locationId);
        renderLocations(locations)
        console.log("🔥 DELETED LOCATION:", res.data)
        showToast(`deleted location [${locationId}]`, "main");

        return res.data
    }
    catch (err) {
        console.log("❌ Backend create failed:", err)
        return null
    }
}

export async function theLocations() {
    if (!locations) return null
    return locations;
}