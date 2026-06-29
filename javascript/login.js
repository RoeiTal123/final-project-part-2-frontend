import { showToast } from "./toast.js";
import { addUser, checkForUser } from "./user.js";
import { uploadToCloudinary } from "./helper.js";

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

// Shows a live preview of the chosen profile picture before upload
const previewProfilePic = (event) => {
    const preview = document.getElementById("signup-profile-pic-preview");
    const file = event.target.files[0];

    if (!file) {
        preview.classList.add("hidden");
        preview.removeAttribute("src");
        return;
    }

    preview.src = URL.createObjectURL(file);
    preview.classList.remove("hidden");
};

async function submitLoginForm() {
    const usernameInput = document.getElementById("login-username");
    const passwordInput = document.getElementById("login-password");

    if (!usernameInput.value || !passwordInput.value) {
        showToast("Please enter both username and password.", "login", "error");
        return;
    }

    const loggedInUser = await checkForUser(usernameInput.value.trim(), passwordInput.value);

    if (loggedInUser) {
        usernameInput.value = "";
        passwordInput.value = "";

        localStorage.setItem("loggedUser", JSON.stringify(loggedInUser));

        console.log("Session started for:", loggedInUser.username);
        
        // Redirect to your main application dashboard
        window.location.href = "../htmls/main.html"; 
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
    const profilePicPreview = document.getElementById("signup-profile-pic-preview");

    if (!usernameInput.value || !passwordInput.value || !emailInput.value) {
        showToast("Please fill in all required fields.", "login", "error");
        return;
    }

    // 🌟 Concatenate first name and family name to match the database 'fullname' column
    const combinedFullName = `${firstnameInput.value.trim()} ${lastnameInput.value.trim()}`.trim();

    // Upload the profile picture first (if one was chosen) so we have a URL
    // to send along with the rest of the signup data.
    let profile_pic_url = "";
    const profilePicFile = profilePicInput.files[0];

    if (profilePicFile) {
        try {
            const uploadResult = await uploadToCloudinary(profilePicFile);
            profile_pic_url = uploadResult.url;
        } catch (err) {
            showToast("Profile picture upload failed. Please try again.", "login", "error");
            return; // Stop signup — don't create an account with a half-finished state
        }
    }

    const userDetails = {
        username: usernameInput.value.trim(),
        password: passwordInput.value,
        fullname: combinedFullName, // Sends a single string to the backend
        email: emailInput.value.trim(),
        birthday: birthdayInput.value ? new Date(birthdayInput.value).toISOString() : null,
        profile_pic_url: profile_pic_url,
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
        profilePicPreview.classList.add("hidden");
        profilePicPreview.removeAttribute("src");

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

    const profilePicInput = document.getElementById("signup-profile-pic");
    if (profilePicInput) {
        profilePicInput.addEventListener("change", previewProfilePic);
    }
});

export function logoutUser() {
    localStorage.removeItem("loggedUser");
    
    window.location.href = "./login.html";
}