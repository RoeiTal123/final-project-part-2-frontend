import { showToast } from "./toast"

document.addEventListener("DOMContentLoaded", Main)

let isDragging = false
let startX = 0
let startY = 0
let mapX = 0
let mapY = 0
let clickStartTime = 0
let locationX = 0
let locationY = 0

let zoomScale = 1.0;       // Starting scale (100%)
const minZoom = 0.5;       // Minimum zoom out limit (50%)
const maxZoom = 2.0;       // Maximum zoom in limit (200%)
const zoomStep = 0.1;      // How fast the zoom changes per wheel notch
let userId = 4 // in this case

export function getIndexs(){
    return {x: locationX,y: locationY}
}

const container = document.getElementById('map-container')
const map = document.getElementById('map-image')
const nameElement = document.getElementById("location-name-input")
const descriptionElement = document.getElementById("location-description-input")
const mapContainer = document.getElementById("map-container");

mapContainer.addEventListener("mousedown", (e) => startMapDrag(e));
mapContainer.addEventListener("mousemove", (e) => whileMapDragging(e));
mapContainer.addEventListener("mouseup", (e) => stopMapDrag(e));
mapContainer.addEventListener("mouseleave", (e) => stopMapDrag(e));
container.addEventListener("wheel", handleMapZoom, { passive: false });

const mapImage = document.getElementById("map-image");

mapImage.addEventListener("dragstart", (e) => {
    e.preventDefault();
});

const modalWindow = document.getElementById("modal-window");

modalWindow.addEventListener("click", (e) => {
    e.stopPropagation();
});

document.querySelector(".cancel-button")
    .addEventListener("click", toggleModal);

document.querySelector(".confirm-button")
    .addEventListener("click", confirmLocation);

const locations = [{
    id: 1, locationName: "", indexs: { x: 1, y: 1 }, descriptionName: "",
    locationImageURL: "", Feeders: [2], ownerid: 1
}]

function updateMapTransform() {
    map.style.transform = `translate(${mapX}px, ${mapY}px) scale(${zoomScale})`;
}

function startMapDrag(event) {
    isDragging = true
    clickStartTime = Date.now()
}

function centerMap() {
    mapX = (container.clientWidth - map.clientWidth) / 2;
    mapY = (container.clientHeight - map.clientHeight) / 2;
    updateMapTransform();
}


// Triggered by onmousemove="whileMapDragging(event)"
function whileMapDragging(event) {
    if (!isDragging || !container || !map) return;

    let targetX = mapX + event.movementX;
    let targetY = mapY + event.movementY;

    // Boundary math adjusted for the current zoom factor
    const minX = container.clientWidth - (map.clientWidth * zoomScale);
    const minY = container.clientHeight - (map.clientHeight * zoomScale);

    // If the zoomed map is smaller than the container, lock it to top-left
    const limitX = minX > 0 ? 0 : minX;
    const limitY = minY > 0 ? 0 : minY;

    if (targetX > 0) targetX = 0;
    if (targetY > 0) targetY = 0;
    if (targetX < limitX) targetX = limitX;
    if (targetY < minY) targetY = limitY;

    mapX = targetX;
    mapY = targetY;
    
    // Call the unified rendering function
    updateMapTransform();
}


// Triggered by onmouseup and onmouseleave
function stopMapDrag(event) {
    if (!isDragging) return;

    isDragging = false;
    const clickDuration = Date.now() - clickStartTime;

    if (clickDuration < 100) {
        const dynamicRect = container.getBoundingClientRect();

        const mouseXInContainer = event.clientX - dynamicRect.left;
        const mouseYInContainer = event.clientY - dynamicRect.top;
        
        // ADJUSTMENT: Divide the container offsets by the zoom scale factor
        const originalX = Math.round((mouseXInContainer - mapX) / zoomScale);
        const originalY = Math.round((mouseYInContainer - mapY) / zoomScale);

        toggleModal(originalX, originalY);
    }
}

function handleMapZoom(event) {
    event.preventDefault();

    const dynamicRect = container.getBoundingClientRect();
    
    // 1. Locate the mouse pointer relative to the viewport container
    const mouseX = event.clientX - dynamicRect.left;
    const mouseY = event.clientY - dynamicRect.top;

    // 2. Identify the exact pixel point under the cursor before scaling
    const mapPointX = (mouseX - mapX) / zoomScale;
    const mapPointY = (mouseY - mapY) / zoomScale;

    // 3. Apply the zoom increment
    const oldScale = zoomScale;
    if (event.deltaY < 0) {
        zoomScale = Math.min(maxZoom, zoomScale + zoomStep);
    } else {
        zoomScale = Math.max(minZoom, zoomScale - zoomStep);
    }

    // 4. Adjust pan offsets so the pixel point remains perfectly fixed under the cursor
    mapX = mouseX - (mapPointX * zoomScale);
    mapY = mouseY - (mapPointY * zoomScale);

    // 5. Enforce boundaries instantly after zooming
    const minX = container.clientWidth - (map.clientWidth * zoomScale);
    const minY = container.clientHeight - (map.clientHeight * zoomScale);
    
    if (mapX > 0) mapX = 0;
    if (mapY > 0) mapY = 0;
    if (mapX < minX && minX < 0) mapX = minX;
    if (mapY < minY && minY < 0) mapY = minY;

    updateMapTransform();
}

function printMapCoordinates(event) {

    // 1. Find where the mouse clicked relative to the container box
    const mouseXInContainer = event.clientX - rect.left
    const mouseYInContainer = event.clientY - rect.top

    // 2. Subtract mapX and mapY to find the coordinate on the ORIGINAL image
    // (Since mapX/Y are negative numbers, subtracting them adds them back)
    const originalX = Math.round(mouseXInContainer - mapX)
    const originalY = Math.round(mouseYInContainer - mapY)

    // 3. Print the values to your browser console for future copy-pasting
    console.log(`Original Map Target -> X: ${originalX}px, Y: ${originalY}px`)

    // OPTIONAL: If you want to use these values right away to open your modal window
}

function toggleModal(originalX, originalY) {
    const overlay = document.getElementById('modal-overlay')

    if (overlay.style.display === 'flex') {
        overlay.style.display = 'none'
    } else {
        overlay.style.display = 'flex'
        setLocation(originalX, originalY)
    }

    nameElement.value = ""
    descriptionElement.value = ""
}

function Main() {
    centerMap()
}

function setLocation(originalX, originalY) {
    const modalHeader = document.getElementById("modal-header")
    modalHeader.innerHTML = `<span>Create new location</span><span class="coords">x: ${originalX} , y: ${originalY}</span>`
    locationX = originalX
    locationY = originalY
}

function confirmLocation() {
    const overlay = document.getElementById('modal-overlay')


    if (overlay.style.display === 'flex') {
        overlay.style.display = 'none'
    } else {
        overlay.style.display = 'flex'
    }
    console.log("location added")
}

function renderNewLocationFeederList() {

}

function renderFeeders(locationId = "1") { // function that renders feeders of the location
    // console.log(list)
    console.log("feeders rendered")
    const location = locations.find(locationInList => locationInList._id === locationId)
    const feederids = [...location.Feeders]
    const feedersContainer = document.getElementById("feeders-list") // creates a 'pointer' to the container so we could interract with it
    if (feeders != null) {

        feedersContainer.innerHTML = feederids.map(feederId => {

            const feeder = users.find(user => user._id === feederId)
            if (!feeder) return ''

            return `
            <div class="feeder-box">
            
                <div class="feeder-left-group">
                    <a href="../htmls/profile.html?id=${feederId}" class="feeder-user">
                       <img src="${feeder.profilePicURL || 'default-avatar.png'}" alt="${feeder.fullname}'s avatar" />
                    </a> 
                    <div class="feeder-user-name">${feeder.fullname}</div>
                </div>

                <div class="feeder-role">
                    ${(feeder._id === location._ownerid) ? 'owner' : 'feeder'}
                </div>
            </div>
            `;
        }).join('')
    }
}