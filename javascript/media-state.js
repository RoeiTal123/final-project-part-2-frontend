export let selectedMediaFile = null;
export let selectedMediaType = "none";

export function setSelectedMedia(file) {
    selectedMediaFile = file;

    if (file === null || file === undefined) {
        selectedMediaType = "none";
        return
    }

    if (file.type.startsWith("image/")) {
        selectedMediaType = "image";
    } 
    else if (file.type.startsWith("video/")) {
        selectedMediaType = "video";
    } 
    else {
        selectedMediaType = "none";
    }
}

export function clearSelectedMedia() {
    selectedMediaFile = null;
    selectedMediaType = "none";
}