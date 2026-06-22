import { saveArrayToStorage, getArrayFromStorage, SQLTimestampToTimestamp } from '../javascript/helper.js'
import { showToast, hideToast } from './toast.js'
import { setSelectedMedia } from "./media-state.js";
import { createPost, deletePost, toggleLike, query, queryFromBackend, postByIdFromBackend, createPostAndPutInBackend, editPostAndPutInBackend, deletePostFromBackend, thePosts } from './post.js'
import { getLoggedInUser, queryUsersFromBackend } from './user.js';

document.addEventListener("DOMContentLoaded", Main)
const radios = document.querySelectorAll('input[name="sort"]');

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

        createBtn.textContent = "Create Post";

        return;
    }

    const currentSort =
        new URLSearchParams(window.location.search).get("sort") || "new";

    const posts = await queryFromBackend(currentSort);
    renderPosts(posts);
});

document.addEventListener("click", async (e) => {
    const editBtn = e.target.closest(".edit-post-btn");

    if (editBtn) {
        const postId = Number(editBtn.dataset.id);
        const posts = await thePosts();
        const post = posts.find(p => p.id === postId);

        document.getElementById("post-title-input").value = post.title;
        document.getElementById("post-description-input").value = post.description;

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
});

radios.forEach(radio => {
    radio.addEventListener("change", async (e) => {
        const value = e.target.value;

        handleSortChange(value);

        const postsToRender = await queryFromBackend(value);
        renderPosts(postsToRender);
    });
});
const cursorGlow = document.getElementById("cursor-glow");

document.addEventListener('mousemove', (e) => {
    cursorGlow.style.setProperty('--mouse-x', `${e.clientX}px`);
    cursorGlow.style.setProperty('--mouse-y', `${e.clientY}px`);

    const intensity = getNearestPostIntensity(e.clientX, e.clientY);
    cursorGlow.style.setProperty('--glow-intensity', intensity);
});

function getFalloffDistance() {
    // Reads --glow-falloff-distance straight from CSS so this number
    // only ever has to be edited in one place (the :root block).
    const raw = getComputedStyle(document.documentElement)
        .getPropertyValue('--glow-falloff-distance')
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

const input = document.getElementById("post-media-input");
const mediaBox = document.getElementById("media-box");

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

function Main() {
    updateMainContent()
    //renderCommunities()
}

export async function renderPosts(list) { // function that renders updates posts
    // console.log(list)
    console.log("posts rendered")
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
                           <a href="../htmls/profile.html?id=${post.user_id}" class="post-user">
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
                       ${post.media_url
                            ? `<div class="post-media">
                            ${post.media_type === "video"
                            ? `<video class="post-video" controls src="${post.media_url}"></video>`
                            : `<img class="post-image" src="${post.media_url}" />`
                            }
                            </div>`
                            : ""
                        }
                <div class="post-footer">
                 <div class="like-container-wrapper" style="position: relative; display: inline-block;">
                  <div class="like-btn ${liked ? 'is-liked' : ''}" data-id="${post.id}">
                    <svg viewBox="0 -2 24 24" height="24px" id="meteor-icon-kit__solid-heart" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="var(--black)" stroke-width="${liked ? '0' : '0.24'}">
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier">
                    <path fill-rule="evenodd" clip-rule="evenodd" fill="${liked ? 'var(--red-two)' : 'none'}"
                     d="M21.4281 11.714L13.9092 19.2329C12.8548 20.2873 11.1452 20.2873 10.0908 19.2329L2.57191 11.714C-0.0315858 9.1105 -0.0315856 4.8894 2.57191 2.28591C5.17541 -0.31759 9.3965 -0.31759 12 2.28591C14.6035 -0.31759 18.8246 -0.31759 21.4281 2.28591C24.0316 4.8894 24.0316 9.1105 21.4281 11.714z"/>
                    </g>
                    </svg>
                    </div>
                  </div>
                  <span>${post.likedByUsers.length}</span>
                </div>
            </div>`;
        }).join("")
    }
}

function getTimeAgo(timestamp) {
    const now = Date.now()
    const diffMs = now - timestamp

    const seconds = Math.floor(diffMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) {
        return `${seconds}s ago`
    }

    if (minutes < 60) {
        return `${minutes}m ago`
    }

    if (hours < 24) {
        return `${hours}h ago`
    }

    return `${days}d ago`
}

function isLiked(postId, userId = userId) { // checks if post with id = postId is liked by user with id = Userid
    const post = query().find(p => p.id === postId);
    return post ? post.likedByUsers.includes(userId) : false;
}

function likePost(postId, userId) {
    console.log("like")
    
    const loggedUser = getLoggedInUser()
    if (!postId) return;

    toggleLike(postId, loggedUser.id);

    const currentSort =
        new URLSearchParams(window.location.search).get("sort") || "new";

    const postsToRender = query(currentSort);

    renderPosts(postsToRender);
}

function handleSortChange(selectedSort) {
    const url = new URL(window.location.href)

    url.searchParams.set('sort', selectedSort)

    window.history.pushState({}, '', url)
}

async function updateMainContent() {
    const urlParams = new URLSearchParams(window.location.search);
    const currentSort = urlParams.get("sort") || "new";
    
    const loggedUser = getLoggedInUser()

    const sortRadio = document.getElementById(currentSort);
    if (sortRadio) sortRadio.checked = true;

    const posts = await queryFromBackend(currentSort)

    renderPosts(posts)

    document.getElementById("input-post-profile-picture").src = loggedUser.profile_pic_url;
}
