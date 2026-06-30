import { saveArrayToStorage, getArrayFromStorage, SQLTimestampToTimestamp, updateProfilePicture, getTimeAgo } from "./helper.js"
import { showToast, hideToast } from "./toast.js"
import { clearSelectedMedia, resetMediaState, setSelectedMedia } from "./media-state.js";
import { createPost, deletePost, toggleLike, query, queryFromBackend, postByIdFromBackend, createPostAndPutInBackend, editPostAndPutInBackend, deletePostFromBackend, thePosts } from "./post.js"
import { getLoggedInUser, queryUsersFromBackend, logoutUser } from "./user.js";

document.addEventListener("DOMContentLoaded", Main)
const radios = document.querySelectorAll('input[name="sort"]');
const cursorGlow = document.getElementById("cursor-glow");
const input = document.getElementById("post-media-input");
const mediaBox = document.getElementById("media-box");

document.addEventListener("click", async (e) => {
    const createBtn = e.target.closest(".create-post-btn");

    if (!createBtn) return;

    const editId = createBtn.dataset.editId;

    let success;

    if (editId) {
        success = await editPostAndPutInBackend(Number(editId));

        if (success) {
            delete createBtn.dataset.editId;
            delete createBtn.dataset.originalTitle;
            delete createBtn.dataset.originalDescription;

            createBtn.textContent = "Add Post";
        }
    } else {
        success = await createPostAndPutInBackend();
    }

    if (!success) {
        delete createBtn.dataset.editId;
        delete createBtn.dataset.originalTitle;
        delete createBtn.dataset.originalDescription;

        // reset UI inputs
        document.getElementById("post-title-input").value = "";
        document.getElementById("post-description-input").value = "";
        mediaBox.innerHTML = "";

        createBtn.textContent = "Create Post";

        return;
    }

    const currentSort =
        new URLSearchParams(window.location.search).get("sort") || "new";

    const posts = await queryFromBackend(currentSort);
    renderPosts(posts);
});

document.addEventListener("click", (e) => {
    const logoutBtn = e.target.closest(".logout-button, .logout-button-mobile");
    if (!logoutBtn) return;

    logoutUser();
});

document.addEventListener("click", async (e) => {
    const editBtn = e.target.closest(".edit-post-btn");

    if (editBtn) {
        const postId = Number(editBtn.dataset.id);
        const posts = await thePosts();
        const post = posts.find(p => p.id === postId);
        resetMediaState();

        document.getElementById("post-title-input").value = post.title;
        document.getElementById("post-description-input").value = post.description;

        mediaBox.innerHTML = "No media selected";

        if (post.media_url) {
            if (post.media_type === "image") {
                const img = document.createElement("img");
                img.src = post.media_url;
                img.classList.add("input-media-image");
                img.onerror = () => {
                    img.onerror = null;
                    img.src = "https://res.cloudinary.com/dukionlns/image/upload/v1782661641/NoFileFound_hnqkoh.png";
                };
                mediaBox.appendChild(img);
            }

            if (post.media_type === "video") {
                const video = document.createElement("video");
                video.src = post.media_url;
                video.controls = true;
                video.classList.add("input-media-video");

                video.onerror = () => {
                    const img = document.createElement("img");
                    img.src = "https://res.cloudinary.com/dukionlns/image/upload/v1782661641/NoFileFound_hnqkoh.png";
                    img.classList.add("input-media-image");
                    video.replaceWith(img);
                };

                mediaBox.appendChild(video);
            }
        }

        const createBtn = document.querySelector(".create-post-btn");

        createBtn.dataset.editId = postId;
        createBtn.dataset.originalTitle = post.title;
        createBtn.dataset.originalDescription = post.description;

        createBtn.textContent = "Edit Post";
    }
});

document.addEventListener("click", async (e) => {
    const removeBtn = e.target.closest(".remove-post-btn");

    if (removeBtn) {
        const id = Number(removeBtn.dataset.id)
        deletePostFromBackend(id);

        const currentSort =
            new URLSearchParams(window.location.search).get("sort") || "new";

        const posts = await queryFromBackend(currentSort)
        renderPosts(posts);
    }
});

document.addEventListener("click", (e) => {
    const likeBtn = e.target.closest(".like-btn");
    if (!likeBtn) return;

    const postId = Number(likeBtn.dataset.id);
    const loggedUser = getLoggedInUser()

    toggleLike(postId, loggedUser.id);
    likeBtn.classList.toggle("is-liked");
});

radios.forEach(radio => {
    radio.addEventListener("change", async (e) => {
        const value = e.target.value;

        handleSortChange(value);

        const postsToRender = await queryFromBackend(value);
        renderPosts(postsToRender);
    });
});

document.addEventListener("mousemove", (e) => {
    cursorGlow.style.setProperty("--mouse-x", `${e.clientX}px`);
    cursorGlow.style.setProperty("--mouse-y", `${e.clientY}px`);

    const intensity = getNearestPostIntensity(e.clientX, e.clientY);
    cursorGlow.style.setProperty("--glow-intensity", intensity);
});

input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedMedia(file);

    const url = URL.createObjectURL(file);

    mediaBox.innerHTML = "";

    if (file.type.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = url;
        img.classList.add("input-media-image");
        mediaBox.appendChild(img);
    }

    else if (file.type.startsWith("video/")) {
        const video = document.createElement("video");
        video.src = url;
        video.controls = true;
        video.classList.add("input-media-video");
        mediaBox.appendChild(video);
    }

    else {
        mediaBox.innerHTML = "unsupported file type";
    }
});

document.querySelector(".input-remove-media").addEventListener("click", () => {
    clearSelectedMedia()
    input.value = "";
    mediaBox.innerHTML = "No media selected";
});

function Main() {
    checkForLoggedInUser();
    updateMainContent();
    updateProfilePicture();
}

function getFalloffDistance() {
    // Reads --glow-falloff-distance straight from CSS so this number
    // only ever has to be edited in one place (the :root block).
    const raw = getComputedStyle(document.documentElement)
        .getPropertyValue("--glow-falloff-distance")
        .trim();

    return parseFloat(raw) || 250; // fallback if the variable is missing
}

function getNearestPostIntensity(x, y) {
    const postBoxes = document.querySelectorAll(".post-box");
    if (postBoxes.length === 0) return 0;

    const falloffDistance = getFalloffDistance();
    let minDistance = Infinity;

    postBoxes.forEach((box) => {
        const rect = box.getBoundingClientRect();
        const dx = Math.max(rect.left - x, 0, x - rect.right);
        const dy = Math.max(rect.top - y, 0, y - rect.bottom);
        const distance = Math.hypot(dx, dy);

        if (distance < minDistance) minDistance = distance;
    });

    const intensity = 1 - minDistance / falloffDistance;
    return Math.max(0, Math.min(1, intensity));
}

export async function renderPosts(list) { // function that renders updates posts
    const postsContainer = document.getElementById("posts-container") // creates a 'pointer' to the container so we could interract with it
    if (list != null) {

        const loggedUser = getLoggedInUser()
        const users = await queryUsersFromBackend()
        postsContainer.innerHTML = list.map(post => {
            const liked = isLiked(post.id, loggedUser.id) // checks is each post is liked by the loggedin user

            const poster = users.find(user => user.id === post.user_id)

            const isOwner = Number(post.user_id) === loggedUser.id;
            return `
            <div class="post-box">
                <div class="post-header">
                           <a class="post-user">
                           <img src="${poster.profile_pic_url}" />
                           </a> 
                           <div class="post-header-right">
                           <div class="left">
                               <div class="post-user-name">${poster.fullname}</div>
                               <div class="post-title">${post.title}</div>
                           </div>
                           <div class="right">
                           <div class="post-date">${getTimeAgo(SQLTimestampToTimestamp(post.created_at))}</div>
                           ${isOwner ? `
                                    <button class="edit-post-btn" data-id="${post.id}">:</button>
                                     <button class="remove-post-btn" data-id="${post.id}">X</button>
                            ` : ""}
                           </div>
                           </div>
                       </div>
                       <div class="post-description">${post.description}</div>
                       ${post.media_url ? `<div class="post-media">
                            ${post.media_type === "video" ? `<video
                            class="post-video" controls src="${post.media_url}"
                            onerror="this.outerHTML='<img class=&quot;post-image&quot; src=&quot;https://res.cloudinary.com/dukionlns/image/upload/v1782661641/NoFileFound_hnqkoh.png&quot;>';"
                            ></video>`
                        : `<img
                            class="post-image"
                            src="${post.media_url}"
                            onerror="this.onerror=null; this.src='https://res.cloudinary.com/dukionlns/image/upload/v1782661641/NoFileFound_hnqkoh.png';"
                            />`
                    }
                        </div>`
                    : ""
                }
                <div class="post-footer">
                 <div class="like-container-wrapper" style="position: relative; display: inline-block;">
                  <div class="like-btn ${liked ? "is-liked" : ""}" data-id="${post.id}">
                    <svg viewBox="0 -2 24 24" height="24px" id="meteor-icon-kit__solid-heart" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="var(--black)" stroke-width="${liked ? '0' : '0.24'}">
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier">
                    <path fill-rule="evenodd" clip-rule="evenodd" fill="${liked ? "var(--red-two)" : "none"}"
                     d="M21.4281 11.714L13.9092 19.2329C12.8548 20.2873 11.1452 20.2873 10.0908 19.2329L2.57191 11.714C-0.0315858 9.1105 -0.0315856 4.8894 2.57191 2.28591C5.17541 -0.31759 9.3965 -0.31759 12 2.28591C14.6035 -0.31759 18.8246 -0.31759 21.4281 2.28591C24.0316 4.8894 24.0316 9.1105 21.4281 11.714z"/>
                    </g>
                    </svg>
                    </div>
                  </div>
                  <span>${post.likedByUsers.length}</span>
                </div>
            </div>`;
        }).join("")
        console.log("posts rendered");
    }
}

function isLiked(postId, userId = userId) { // checks if post with id = postId is liked by user with id = Userid
    const post = query().find(p => p.id === postId);
    return post ? post.likedByUsers.includes(userId) : false;
}

function likePost(postId, userId) {

    const loggedUser = getLoggedInUser();
    if (!postId) return;

    toggleLike(postId, loggedUser.id);

    const currentSort = new URLSearchParams(window.location.search).get("sort") || "new";

    const postsToRender = query(currentSort);

    renderPosts(postsToRender);
}

function handleSortChange(selectedSort) {
    const url = new URL(window.location.href)

    url.searchParams.set("sort", selectedSort)

    window.history.pushState({}, "", url)
}

async function updateMainContent() {
    const urlParams = new URLSearchParams(window.location.search);
    const currentSort = urlParams.get("sort") || "new";

    const loggedUser = getLoggedInUser()

    const sortRadio = document.getElementById(currentSort);
    if (sortRadio) sortRadio.checked = true;

    const posts = await queryFromBackend(currentSort)

    renderPosts(posts)
    if (loggedUser && loggedUser.profile_pic_url != null) {
        document.getElementById("input-post-profile-picture").src = loggedUser.profile_pic_url;
    }
    else
    {
        document.getElementById("input-post-profile-picture").src = "https://res.cloudinary.com/dukionlns/image/upload/v1782123407/Profile_Button_j0t29p.png";
    }

}

function checkForLoggedInUser() {
    const loggedInUser = getLoggedInUser();
    if (!loggedInUser) {
        const postCreationElement = document.getElementById("post-creation-box");
        postCreationElement.style.display = "none";
    }
}