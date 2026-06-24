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

let userId = 4 // in this case

export function getIndexs(){
    return {x: locationX,y: locationY}
}

const container = document.getElementById('map-container')
const map = document.getElementById('map-image')
const rect = container.getBoundingClientRect()


const nameElement = document.getElementById("location-name-input")
const descriptionElement = document.getElementById("location-description-input")

const mapContainer = document.getElementById("map-container");

mapContainer.addEventListener("mousedown", startMapDrag);
mapContainer.addEventListener("mousemove", whileMapDragging);
mapContainer.addEventListener("mouseup", stopMapDrag);
mapContainer.addEventListener("mouseleave", stopMapDrag);

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

const locations = [{ id: 1, location_name: "cat sanctuary", Xindexs: 250, Yindex: 250 , 
                     description_name: "heaven for cats", location_image_url: "", Feeders: [1, 2], owner_id: 1}]

function startMapDrag(event) {
    isDragging = true
    clickStartTime = Date.now()
}

function centerMap() {
    // Math: (Container Size - Map Size) / 2 resulting in a negative offset
    mapX = (container.clientWidth - map.clientWidth) / 2
    mapY = (container.clientHeight - map.clientHeight) / 2

    map.style.transform = `translate(${mapX}px, ${mapY}px)`
}

// Triggered by onmousemove="whileMapDragging(event)"
function whileMapDragging(event) {
    if (!isDragging) return

    if (!container || !map) return // Safety check

    let targetX = mapX + event.movementX
    let targetY = mapY + event.movementY


    const minX = container.clientWidth - map.clientWidth
    const minY = container.clientHeight - map.clientHeight

    if (targetX > 0) targetX = 0
    if (targetY > 0) targetY = 0
    if (targetX < minX) targetX = minX
    if (targetY < minY) targetY = minY

    mapX = targetX
    mapY = targetY
    map.style.transform = `translate(${mapX}px, ${mapY}px)`
}

// Triggered by onmouseup and onmouseleave
function stopMapDrag() {
    if (!isDragging) return

    isDragging = false
    const clickDuration = Date.now() - clickStartTime

    // If held for less than 200ms, the user intended to CLICK, not drag!
    if (clickDuration < 200) {

        // Calculate original coordinates relative to the un-scrolled image
        const mouseXInContainer = event.clientX - rect.left
        const mouseYInContainer = event.clientY - rect.top
        const originalX = Math.round(mouseXInContainer - mapX)
        const originalY = Math.round(mouseYInContainer - mapY)

        // console.log(`Original Map Target -> X: ${originalX}px, Y: ${originalY}px`)

        // You can trigger your popup window here now!
        toggleModal(originalX, originalY)
    }
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