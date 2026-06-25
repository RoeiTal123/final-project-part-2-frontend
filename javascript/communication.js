
const BASE_URL =
    window.location.hostname === 'localhost'
        ? 'http://localhost:3000/api/'
        : 'https://final-project-part-2-backend.onrender.com/api/';

export const httpService = { // Our methods of communication (Titles)
    get(endpoint, data) {
        return ajax(endpoint, 'GET', data)
    },
    post(endpoint, data) {
        return ajax(endpoint, 'POST', data)
    },
    put(endpoint, data) {
        return ajax(endpoint, 'PUT', data)
    },
    delete(endpoint, data) {
        return ajax(endpoint, 'DELETE', data)
    }
}

async function ajax(endpoint, method = 'GET', data = null) {
    let url = `${BASE_URL}${endpoint}`;

    if (method === 'GET' && data) {
        const query = new URLSearchParams(data).toString();
        url += `?${query}`;
    }

    const hasBody =
        ["POST", "PUT", "DELETE"].includes(method) &&
        data !== null &&
        data !== undefined;

    const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: hasBody ? JSON.stringify(data) : undefined
    });

    if (!response.ok) throw new Error(response.status);

    return response.json();
}