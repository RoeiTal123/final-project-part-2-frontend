import { showToast } from "./toast.js";
import { addUser, checkForUser } from "./user.js"; 

const showSignup = (event) => {
    if (event) event.preventDefault();
    document.getElementById('loginWindow').classList.add('hidden');
    document.getElementById('signupWindow').classList.remove('hidden');
};

const showLogin = (event) => {
    if (event) event.preventDefault();
    document.getElementById('signupWindow').classList.add('hidden');
    document.getElementById('loginWindow').classList.remove('hidden');
};

const removeNumbers = (event) => {
    event.target.value = event.target.value.replace(/\d/g, '');
};

const removeLetters = (event) => {
    event.target.value = event.target.value.replace(/\D/g, '');
};

const formatPhoneNumber = (event) => {
    let num = event.target.value.replace(/\D/g, '');
    if (num.length <= 3) {
        event.target.value = num;
    } else if (num.length <= 6) {
        event.target.value = `${num.slice(0, 3)} ${num.slice(3)}`;
    } else {
        event.target.value = `${num.slice(0, 3)} ${num.slice(3, 6)}-${num.slice(6, 10)}`;
    }
};

const countLetters = (textarea) => {
    const display = document.getElementById("word-count-display");
    if (!display) return;
    const maxLetters = 1000;
    let letterCount = textarea.value.length;
    if (letterCount > maxLetters) {
        textarea.value = textarea.value.slice(0, maxLetters);
        letterCount = maxLetters;
    }
    display.textContent = `${letterCount}/${maxLetters}`;
};

async function submitLoginForm() {
    const usernameInput = document.getElementById("login-username");
    const passwordInput = document.getElementById("login-password");

    if (!usernameInput.value || !passwordInput.value) {
        showToast("Please enter both username and password.", "error");
        return;
    }

    const loggedInUser = await checkForUser(usernameInput.value.trim(), passwordInput.value);

    if (loggedInUser) {
        usernameInput.value = "";
        passwordInput.value = "";

        console.log("Logged in user details:", loggedInUser);
        
    }
}


async function submitSignupForm() {
    const firstnameInput = document.getElementById("signup-firstname");
    const lastnameInput = document.getElementById("signup-lastname");
    const emailInput = document.getElementById("signup-email");
    const usernameInput = document.getElementById("signup-username");
    const passwordInput = document.getElementById("signup-password");
    const birthdayInput = document.getElementById("signup-birthday");
    const profilePicInput = document.getElementById("signup-profile-pic");

    if (!usernameInput.value || !passwordInput.value || !emailInput.value) {
        showToast("Please fill in all required fields.", "error");
        return;
    }

    // 🌟 Concatenate first name and family name to match the database 'fullname' column
    const combinedFullName = `${firstnameInput.value.trim()} ${lastnameInput.value.trim()}`.trim();

    const userDetails = {
        username: usernameInput.value.trim(),
        password: passwordInput.value,
        fullname: combinedFullName, // Sends a single string to the backend
        email: emailInput.value.trim(),
        birthday: birthdayInput.value ? new Date(birthdayInput.value).toISOString() : null,
        profile_pic_url: profilePicInput.value.trim(),
        user_type: "user" 
    };

    const response = await addUser(userDetails);

    if (response && response.success) {
        // Reset fields cleanly
        firstnameInput.value = "";
        lastnameInput.value = "";
        emailInput.value = "";
        usernameInput.value = "";
        passwordInput.value = "";
        birthdayInput.value = "";
        profilePicInput.value = "";

        showLogin();
    }
}

window.showSignup = showSignup;
window.showLogin = showLogin;
window.removeNumbers = removeNumbers;
window.removeLetters = removeLetters;
window.formatPhoneNumber = formatPhoneNumber;
window.countLetters = countLetters;
window.submitLoginForm = submitLoginForm;
window.submitSignupForm = submitSignupForm;

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            submitLoginForm();
        });
    }
    
    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
        signupForm.addEventListener("submit", (e) => {
            e.preventDefault();
            submitSignupForm();
        });
    }
});
