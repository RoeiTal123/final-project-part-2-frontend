import { getLoggedInUser } from "./user.js"

const DEFAULT_AVATAR = "../design/images/Profile Button.png";

export function saveArrayToStorage(key, array) {
  localStorage.setItem(key, JSON.stringify(array))
}

export function getArrayFromStorage(key, defaultArray = []) {
  const storedData = localStorage.getItem(key)

  // If nothing is in localStorage, return the default array
  if (!storedData) {
    return defaultArray
  }

  const parsedArray = JSON.parse(storedData)

  // If the stored array is completely empty [], also fallback to the default array
  if (parsedArray.length === 0) {
    return defaultArray
  }

  return parsedArray
}

export function generateId(length = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    result += chars[randomIndex]
  }

  return result
}

export function SQLTimestampToTimestamp(sqlTimestamp) {
  return new Date(sqlTimestamp).getTime();
}

export async function uploadToCloudinary(file) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", "cat_sanctuary_media");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dukionlns/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();

  // 🚨 IMPORTANT: stop on failure
  if (!res.ok) {
    console.error("Cloudinary upload failed:", data);
    throw new Error(data?.error?.message || "Cloudinary upload failed");
  }

  return {
    url: data.secure_url,
    publicId: data.public_id
  };
}

export function updateProfilePicture() {
    const profileImg = document.querySelector(".profile-logo")
    const loggedInUser = getLoggedInUser();

    if (!profileImg || !loggedInUser) return

    profileImg.src = loggedInUser.profile_pic_url || DEFAULT_AVATAR
}

export function getTimeAgo(timestamp) {
    const now = Date.now();
    const diffMs = now - timestamp;

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
        return `${seconds}s ago`;
    }

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    if (hours < 24) {
        return `${hours}h ago`;
    }

    return `${days}d ago`;
}