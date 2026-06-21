

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

async function uploadToCloudinary(file) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", "YOUR_UPLOAD_PRESET"); // from Cloudinary
  formData.append("cloud_name", "YOUR_CLOUD_NAME");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();

  return data.secure_url; // THIS is your final image URL
}