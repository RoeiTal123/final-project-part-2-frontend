import { showToast } from './toast.js';

// Base URL pointing straight to your working Node/Express server backend
const BASE_URL = 'http://localhost:3000/api/users';

export async function queryUsersFromBackend() {
    try {
        const response = await fetch(BASE_URL, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        console.log("🔥 BACKEND USERS:", data);
        return data;
    } catch (err) {
        console.error("❌ Backend user query failed:", err);
        showToast("Failed to load users", "error");
        return null;
    }
}

export async function addUser(userDetails) {
    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(userDetails)
        });

        const data = await response.json();

        if (!response.ok) {
            // This catches the 400 Bad Request error from your duplicate Postgres username check
            throw new Error(data.error || "Registration failed");
        }

        showToast("Registration successful!", "success");
        return data;
    } catch (err) {
        console.error("❌ Failed to register user:", err);
        showToast(err.message, "error");
        return null;
    }
}

export async function checkForUser(username, password) {
    try {
        const response = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Invalid credentials");
        }

        showToast("Login successful!", "success");
        return data;
    } catch (err) {
        console.error("❌ Login failed:", err);
        showToast(err.message, "error");
        return null;
    }
}
