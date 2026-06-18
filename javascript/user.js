import { httpService } from './communication.js';

export async function loginUserWithBackend(username, password) {
    try {
        // httpService.post targets: http://localhost:3000/api/users/login
        const data = await httpService.post('users/login', { username, password });
        console.log("🔥 LOGGED IN USER:", data);
        return data; // Returns the user rows array or object
    } catch (err) {
        console.error("❌ Login service layer failure");
        return null;
    }
}

export async function getUsersFromBackend() {
    try {
        return await httpService.get('users');
    } catch (err) {
        return null;
    }
}

export async function getUserByIdFromBackend(userId = "") {
    try {
        return await httpService.get(`users/${userId}`);
    } catch (err) {
        return null;
    }
}

export async function addUserToBackend(userData) {
    try {
        return await httpService.post('users', userData);
    } catch (err) {
        return null;
    }
}

export async function deleteUserFromBackend(userId) {
    try {
        return await httpService.delete('users', { id: userId });
    } catch (err) {
        return null;
    }
}
