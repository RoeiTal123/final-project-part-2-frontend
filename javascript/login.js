import { showToast } from "./toast";
import { loginUserWithBackend } from "./user.js"; // Import the login client function

document.addEventListener("DOMContentLoaded", Main)

function Main () {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            submitLoginForm();
        });
    }
}

function showSignup(event) {
    event.preventDefault();
    document.getElementById('loginWindow').classList.add('hidden');
    document.getElementById('signupWindow').classList.remove('hidden');
}

function showLogin(event) {
    event.preventDefault();
    document.getElementById('signupWindow').classList.add('hidden');
    document.getElementById('loginWindow').classList.remove('hidden');
}

function removeNumbers(event) {
    event.target.value = event.target.value.replace(/\d/g, '');
}

function removeLetters(event) {
    event.target.value = event.target.value.replace(/\D/g, '');
}

function formatPhoneNumber(event) {
    let num = event.target.value.replace(/\D/g, '');
    if (num.length <= 3) {
        event.target.value = num;
    } else if (num.length <= 6) {
        event.target.value = `${num.slice(0, 3)} ${num.slice(3)}`;
    } else {
        event.target.value = `${num.slice(0, 3)} ${num.slice(3, 6)}-${num.slice(6, 10)}`;
    }
}

function countLetters(textarea) {
    const display = document.getElementById("word-count-display");
    const maxLetters = 1000;
    let letterCount = textarea.value.length;
    
    if (letterCount > maxLetters) {
        textarea.value = textarea.value.slice(0, maxLetters);
        letterCount = maxLetters;
    }
    display.textContent = `${letterCount}/${maxLetters}`;
}

async function submitLoginForm() {
    const usernameEl = document.getElementById("login-username");
    const passwordEl = document.getElementById("login-password");

    if (!usernameEl || !passwordEl) {
        showToast("Login fields missing from HTML template", "main");
        return;
    }

    const username = usernameEl.value.trim();
    const password = passwordEl.value.trim();

    if (!username || !password) {
        showToast("Please enter your username and password", "main");
        return;
    }

    const userResult = await loginUserWithBackend(username, password);

    if (userResult) {
        const currentUser = Array.isArray(userResult) ? userResult[0] : userResult;

        if (!currentUser) {
            showToast("Invalid username or password", "main");
            return;
        }

        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        
        showToast(`Welcome back, ${currentUser.username}!`, "main");
        
        setTimeout(() => {
            window.location.href = "main.html";
        }, 1000);
    } else {
        showToast("Invalid username or password", "main");
    }
}


async function submitSignupForm() {
    // 1. Gather all document input fields
    const fnameEl = document.getElementById("fname");
    const lnameEl = document.getElementById("lname");
    const phoneEl = document.getElementById("phone");
    const emailEl = document.getElementById("email");
    const usernameEl = document.getElementById("signup-username");
    const passwordEl = document.getElementById("signup-password");
    const dobEl = document.getElementById("dob");
    const catLikesEl = document.getElementById("cat-likes");

    // 2. Client-side validation check
    if (!fnameEl.value || !lnameEl.value || !phoneEl.value || !emailEl.value || 
        !usernameEl.value || !passwordEl.value || !dobEl.value || !catLikesEl.value) {
        showToast("Please fill in all signing up fields", "main");
        return;
    }

    // 3. Construct payload object payload matching backend expectations
    const userData = {
        fname: fnameEl.value.trim(),
        lname: lnameEl.value.trim(),
        phone: phoneEl.value.trim(),
        email: emailEl.value.trim(),
        username: usernameEl.value.trim(),
        password: passwordEl.value.trim(),
        dob: dobEl.value,
        catLikes: catLikesEl.value.trim()
    };

    // 4. Send request through your API layer (user.js) which hits httpService
    const result = await addUserToBackend(userData);

    if (result && result.userId) {
        showToast("Account created successfully! Please log in.", "main");
        
        // 5. Clean form inputs
        document.getElementById("signupForm").reset();
        document.getElementById("word-count-display").textContent = "0/1000";

        // 6. Automatically toggle UI views back to login window pane
        // Simulated click action to reuse your custom interface toggle routing layout
        showLogin(new Event('click'));
    } else {
        showToast("Failed to register account. Try again.", "main");
    }
}
