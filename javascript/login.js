document.addEventListener("DOMContentLoaded", Main)

const DUMMY_USER = {
    username: "catlover123",
    password: "password123"
};

function Main () {
    
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

function submitLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    const usernameInput = document.getElementById('login-username').value;
    const passwordInput = document.getElementById('login-password').value;

    if (usernameInput === DUMMY_USER.username && passwordInput === DUMMY_USER.password) {
        console.log("Login form submitted successfully!");
        window.location.href = "main.html";
    } 
    else {
        alert("Invalid username or password. Please try again.");
    }
}

function submitSignupForm() {
    const form = document.getElementById('signupForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    console.log("Signup form submitted successfully!");
    window.location.href = "main.html";
}
