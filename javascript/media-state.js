export let selectedMediaFile = null;
export let selectedMediaType = "none";
export let mediaAction = "keep"; // "keep" | "replace" | "remove"

export function setSelectedMedia(file) {
    selectedMediaFile = file;

    if (!file) {
        selectedMediaType = "none";
        mediaAction = "keep";
        return;
    }

    mediaAction = "replace";

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
    mediaAction = "remove";
}

export function resetMediaState() {
    selectedMediaFile = null;
    selectedMediaType = "none";
    mediaAction = "keep";
}