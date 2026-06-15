import { saveArrayToStorage, getArrayFromStorage } from '../javascript/helper.js'
import { showToast, hideToast } from './toast.js'

document.addEventListener("DOMContentLoaded", Main)
const radios = document.querySelectorAll('input[name="sort"]');

document.querySelector(".create-post-btn")
    .addEventListener("click", createPost);

document.addEventListener("click", (e) => {
    const removeBtn = e.target.closest(".remove-post-btn");
    if (removeBtn) {
        deletePost(removeBtn.dataset.id);
    }

    const likeBtn = e.target.closest(".like-btn");
    if (likeBtn) {
        likePost(likeBtn.dataset.id);
    }
});

radios.forEach(radio => {
    radio.addEventListener("change", (e) => {
        alterPosts(e.target.value);
    });
});


let sortMethod = "none"

let defaultPosts = [
    {
        _id: '1',
        _userid: '1',
        title: "bread",
        description: "bread",
        mediaType: "image",
        mediaUrl: "../design/images/cat images/DSC_6795.avif",
        likedByUsers: ['2'],
        createdAt: 1767564832000
    },

    {
        _id: '2',
        _userid: '2',
        title: "Why does my cat scream at 3AM?",
        description: "Every single night she starts running around and yelling.",
        mediaType: "none",
        mediaUrl: "",
        likedByUsers: ['1'],
        createdAt: 1775182306000
    },

    {
        _id: '3',
        _userid: '3',
        title: "Orange cat sleeping",
        description: "Caught him sleeping upside down again.",
        mediaType: "image",
        mediaUrl: "../design/images/cat images/DSC_6822.jpg",
        likedByUsers: [],
        createdAt: 1773928849000
    },

    {
        _id: '4',
        _userid: '1',
        title: "Tiny kitten attack",
        description: "She keeps attacking my shoelaces.",
        mediaType: "video",
        mediaUrl: "../design/videos/cat-video.mp4",
        likedByUsers: ['2'],
        createdAt: 1772681104000
    },

    {
        _id: '5',
        _userid: '2',
        title: "Cat food recommendations?",
        description: "Looking for dry food for a picky cat.",
        mediaType: "none",
        mediaUrl: "",
        likedByUsers: [],
        createdAt: 1770219087000
    },

    {
        _id: '6',
        _userid: '3',
        title: "Window watcher",
        description: "He sat here for 2 hours watching birds.",
        mediaType: "image",
        mediaUrl: "../design/images/cat images/Sphynx_cat.jpg",
        likedByUsers: ['3', '4'],
        createdAt: 1771456721000
    },

    {
        _id: '7',
        _userid: '1',
        title: "How do I stop scratching?",
        description: "My couch is losing the war.",
        mediaType: "none",
        mediaUrl: "",
        likedByUsers: ['1', '3'],
        createdAt: 1778841205000
    },

    {
        _id: '8',
        _userid: '2',
        title: "Zoomies compilation",
        description: "Recorded the evening chaos.",
        mediaType: "video",
        mediaUrl: "../design/videos/zoomies.mp4",
        likedByUsers: ['4', '1', '2', '3'],
        createdAt: 1776419923000
    },

    {
        _id: '9',
        _userid: '3',
        title: "Loaf mode activated",
        description: "Perfect loaf formation achieved.",
        mediaType: "image",
        mediaUrl: "../design/images/cat images/Russian_blue_cat.webp",
        likedByUsers: ['1', '2'],
        createdAt: 1777654108000
    },

    {
        _id: '10',
        _userid: '1',
        title: "Is my cat too fluffy?",
        description: "Summer is coming and he looks like a carpet.",
        mediaType: "none",
        mediaUrl: "",
        likedByUsers: ['1'],
        createdAt: 1768892455000
    }
]

let posts = getArrayFromStorage('posts', defaultPosts)

const users = [{
    _id: "1", username: "moshe", password: "moshedat", fullname: "moshe perets", mail: "moshe@dat.com", createdAt: 1778841205000,
    birthday: 1021669200000, profilePicURL: "../design/images/profile pictures/man_1.avif", userType: "feeder", feedingStations: [{ _id: 1, status: "owner" }], posts: ["1", "4", "7", "10"]
},
{
    _id: "2", username: "rebecca", password: "beccabec", fullname: "rebecca black", mail: "reb@becca.com", createdAt: 1778841205000,
    birthday: 1021669200000, profilePicURL: "../design/images/profile pictures/woman_1.avif", userType: "user", feedingStations: [], posts: ["2", "5", "8"]
},
{
    _id: "3", username: "princess", password: "royalty", fullname: "princess dorothy", mail: "princess@cess.com", createdAt: 1778841205000,
    birthday: 1021669200000, profilePicURL: "../design/images/profile pictures/woman_2.jpg", userType: "moderator", feedingStations: [], posts: ["3", "6", "9"]
},
{
    _id: "4", username: "breado", password: "bread123", fullname: "breado bread", mail: "bread@b.com", createdAt: 1778841205000,
    birthday: 1021669200000, profilePicURL: "../design/images/profile pictures/man_2.jpg", userType: "feeder", feedingStations: [{ _id: 1, status: "owner" }], posts: []
}]

const chats = [{
    _id: "1", chatName: "tuxedo owners", chatLogo: "", chatters: ["1", "3"],
    messages: [{ _id: "1", text: "hey" }, { _id: "3", text: "hey" }, { _id: "1", text: "how are you doing?" }],
    createdAt: 1767564832000
}]

const communities = [{
    _id: "1", communityName: "meowers", communityLogo: "",
    communityBakcground: "", ownerId: "", moderators: [],
    members: ["4"], posts: ["2", "5"], createdAt: 1767564832000
}]

let postsForRender = posts.filter(p => true)

let userId = "4" // in this case

function Main() {
    //renderPosts()
    updateMainContent()
    renderCommunities()
}

function renderPosts(list = postsForRender) { // function that renders updates posts
    // console.log(list)
    console.log("posts rendered")
    const postsContainer = document.getElementById("posts-container") // creates a 'pointer' to the container so we could interract with it
    if (list != null) {

        postsContainer.innerHTML = list.map(post => {
            const liked = isLiked(post._id, userId) // checks is each post is liked by the loggedin user

            const poster = users.find(user => user._id === post._userid)
            // console.log(poster)
            return `
            <div class="post-box">
                <div class="post-header">
                           <a href="../htmls/profile.html?id=${post._userid}" class="post-user">
                           <img src="${poster.profilePicURL}" />
                           </a> 
                           <div class="post-header-right">
                           <div class="left">
                               <div class="post-user-name">${poster.fullname}</div>
                               <div class="post-title">${post.title}</div>
                           </div>
                           <div class="right">
                           <div class="post-date">${getTimeAgo(post.createdAt)}</div>
                           <button class="remove-post-btn" data-id="${post._id}">X</button>
                           </div>
                           </div>
                       </div>
                       <div class="post-description">${post.description}</div>
                       ${post.mediaType !== "none"
                    ? `<div class="post-media">
                               ${post.mediaType === "image"
                        ? `<img class="post-image" src="${post.mediaUrl}" />`
                        : `<video class="post-video" controls src="${post.mediaUrl}"></video>`
                    }
                </div>`: ""}
                <div class="post-footer">
                  <div class="like-btn" data-id="${post._id}">
                    <svg viewBox="0 -2 24 24" height="24px" id="meteor-icon-kit__solid-heart" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="var(--black)" stroke-width="${liked ? '0' : '0.24'}">
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier">
                    <path fill-rule="evenodd" clip-rule="evenodd" fill="${liked ? 'var(--red-two)' : 'none'}"
                     d="M21.4281 11.714L13.9092 19.2329C12.8548 20.2873 11.1452 20.2873 10.0908 19.2329L2.57191 11.714C-0.0315858 9.1105 -0.0315856 4.8894 2.57191 2.28591C5.17541 -0.31759 9.3965 -0.31759 12 2.28591C14.6035 -0.31759 18.8246 -0.31759 21.4281 2.28591C24.0316 4.8894 24.0316 9.1105 21.4281 11.714z"/>
                    </g>
                    </svg>
                  </div>
                  <span>${post.likedByUsers.length}</span>
                </div>
            </div>`;
        }).
            join("")
    }
}

function renderCommunities() {
    const container = document.querySelector(".communities-box")

    const userCommunities = communities.filter(c =>
        c.ownerId === userId ||
        c.moderators.includes(userId) ||
        c.members.includes(userId)
    )

    if (userCommunities.length === 0) {
        container.innerHTML = `
      <div class="community-empty">
        Join a community now
      </div>`
        return
    }

    container.innerHTML = userCommunities.map(c => {
        const role = getUserRole(c, userId)

        let roleClass = ""
        const logo = c.communityLogo ? c.communityLogo : "../design/images/cat-svg.svg";

        if (role === "owner") roleClass = "red"
        else if (role === "moderator") roleClass = "yellow"
        else if (role === "member") roleClass = "green"

        return `
                <div class="community">
                    <a href="../htmls/community.html?id=${c._id}" class="community-logo">
                        <img src="${logo}" />
                    </a>
                    <span class="community-name ${roleClass}">
                        ${c.communityName}
                    </span>
                </div>
        `
    }).join("")
}

function getUserRole(community, userId) {
    if (community.ownerId === userId) return "owner"
    if (community.moderators.includes(userId)) return "moderator"
    if (community.members.includes(userId)) return "member"
    return null
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

function alterPosts(value = sortMethod) { // function to sort / filter posts
    const storedPosts = [...posts]
    let alteredPosts // variable for posts to alter
    if (value === sortMethod) return

    switch (value) { // checks the value of the chosen input radio button

        case "new":
            sortMethod = "new"
            alteredPosts = [...storedPosts].sort((a, b) => b.createdAt - a.createdAt) // + = true so it sorts if gap in time is smaller because today < yestarday
            break                                                               // the bigger the timestamp, the more time had passed

        case "old":
            sortMethod = "old"
            alteredPosts = [...storedPosts].sort((a, b) => a.createdAt - b.createdAt) // - = false, does the opposite of the other sort
            break

        case "day":
            sortMethod = "day"
            alteredPosts = [...storedPosts].filter(post =>                            // filters based on value, timestamp is in miliseconds so 1=1 milisecond, 1000 = 1 second, 60000 = minute
                post.createdAt >= Date.now() - (1000 * 60 * 60 * 24))           // 3,600,000 = hour, that x 24 = day
            break

        case "week":
            sortMethod = "week"
            alteredPosts = [...storedPosts].filter(post =>                            // filters the same way but now day x 7 = week
                post.createdAt >= Date.now() - (1000 * 60 * 60 * 24 * 7))
            break

        case "month":
            sortMethod = "month"
            alteredPosts = [...storedPosts].filter(post =>                            // filters the same way but now day x 30 = month
                post.createdAt >= Date.now() - (1000 * 60 * 60 * 24 * 30))
            break
    }
    handleSortChange(value)
    postsForRender = [...alteredPosts]                                        // updates the list we use, not database itself
    renderPosts(alteredPosts)
    // showToast(`sorted / filtered by ${value}`,"main")
    // console.log(`sorted / filtered by ${value}`)
}

function isLiked(postId, userId = userId) { // checks if post with id = postId is liked by user with id = Userid
    const post = postsForRender.find(p => p._id === postId)
    return post.likedByUsers.includes(userId) // checks if array has variable, so it checks if likedByUser[] has userId
}

function likePost(postId) { // likes or dislikes post if it's already liked or not
    if (postId === null || postId === undefined) { // if id doesn't exist it can't work
        return false
    }
    const post = postsForRender.find(p => p._id === postId) // checks if an object in the array has ._id === postId and returns the first occurance
    // so it searchs for that post
    const liked = isLiked(postId, userId) // checks if it's liked
    if (liked) { // it's liked? remove the like
        post.likedByUsers = post.likedByUsers.filter(id => id !== userId) // removes the like by filtering that user' id out
    } else {
        post.likedByUsers.push(userId) // adds the id in the end because the order doesn't matter
    }
    renderPosts(postsForRender) // renders the posts
}

function handleSortChange(selectedSort) {
    const url = new URL(window.location.href)

    url.searchParams.set('sort', selectedSort)

    window.history.pushState({}, '', url)
}

function updateMainContent() {
    const urlParams = new URLSearchParams(window.location.search)

    const currentSort = urlParams.get('sort') || "new"

    if (currentSort) {
        const sortRadio = document.getElementById(currentSort)
        if (sortRadio) {
            sortRadio.checked = true
        }
    }

    alterPosts(currentSort)

    const user = users.find(user => user._id === userId)
    const postCreator = document.getElementById("input-post-profile-picture")
    postCreator.src = user.profilePicURL
}

function createPost() {
    const postTitle = document.getElementById("post-title-input")
    const postDescription = document.getElementById("post-descrption-input")
    const actualPostTitle = postTitle.value
    const actualPostDescription = postDescription.value
    if (actualPostTitle === "") {
        showToast(`you forgot title you stupid`, "main");
        return
    }
    if (actualPostDescription === "") {
        showToast(`you forgot description you stupid`, "main");
        return
    }
    //console.log(`postTitle: ${actualPostTitle} | postDescription: ${actualPostDescription}`)
    const newPost = {
        _id: generateId(), _userid: userId, title: actualPostTitle, description: actualPostDescription,
        mediaType: "none", mediaUrl: "", likedByUsers: [], createdAt: Date.now()
    }
    postTitle.value = ""
    postDescription.value = ""
    posts.push(newPost)
    saveArrayToStorage('posts', posts);
    postsForRender = posts.filter(p => true)
    sortMethod = "none"
    showToast(`created new post with id : [${newPost._id}]`, "main");
    updateMainContent()
    alterPosts()
}

function deletePost(postId = "") {
    if (postId === "") {
        showToast(`there is no post in ba sing se`, "main");
        return
    }
    const post = posts.find(post => post._id === postId)
    // console.log("postId: "+postId)
    // console.log("posts: ")
    // console.log(posts)
    // console.log("post: "+post)
    if (post._userid !== userId) {
        showToast(`this aint your post boy!`, "main");
        return
    }
    posts = posts.filter(post => post._id !== postId)
    saveArrayToStorage('posts', posts)
    postsForRender = posts.filter(p => true)
    sortMethod = "none"
    updateMainContent()
    showToast(`deleted post with id : [${postId}]`, "main");
}

function generateId(length = 16) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length)
        result += chars[randomIndex]
    }

    return result
}

let usersKey = "users"
let postsKey = "posts"

