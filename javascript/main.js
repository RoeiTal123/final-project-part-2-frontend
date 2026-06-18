import { saveArrayToStorage, getArrayFromStorage, SQLTimestampToTimestamp } from '../javascript/helper.js'
import { showToast, hideToast } from './toast.js'
import { createPost, deletePost, toggleLike, query, queryFromBackend, postByIdFromBackend, createPostAndPutInBackend } from './post.js'

document.addEventListener("DOMContentLoaded", Main)
const radios = document.querySelectorAll('input[name="sort"]');

document.querySelector(".create-post-btn")
    .addEventListener("click", () => {
        createPostAndPutInBackend();

        const currentSort =
            new URLSearchParams(window.location.search).get("sort") || "new";

        renderPosts(queryFromBackend(currentSort));
    });

document.addEventListener("click", (e) => {
    const removeBtn = e.target.closest(".remove-post-btn");

    if (removeBtn) {
        deletePost(removeBtn.dataset.id);

        const currentSort =
            new URLSearchParams(window.location.search).get("sort") || "new";

        renderPosts(queryFromBackend(currentSort));
    }
});

radios.forEach(radio => {
    radio.addEventListener("change", async (e) => {
        const value = e.target.value;

        handleSortChange(value);

        const postsToRender = await queryFromBackend(value);
        renderPosts(postsToRender);
    });
});


const users = [{
    _id: 1, username: "moshe", password: "moshedat", fullname: "moshe perets", mail: "moshe@dat.com", createdAt: 1778841205000,
    birthday: 1021669200000, profilePicURL: "../design/images/profile pictures/man_1.avif", userType: "feeder", feedingStations: [{ _id: 1, status: "owner" }], posts: ["1", "4", "7", "10"]
},
{
    _id: 2, username: "rebecca", password: "beccabec", fullname: "rebecca black", mail: "reb@becca.com", createdAt: 1778841205000,
    birthday: 1021669200000, profilePicURL: "../design/images/profile pictures/woman_1.avif", userType: "user", feedingStations: [], posts: ["2", "5", "8"]
},
{
    _id: 3, username: "princess", password: "royalty", fullname: "princess dorothy", mail: "princess@cess.com", createdAt: 1778841205000,
    birthday: 1021669200000, profilePicURL: "../design/images/profile pictures/woman_2.jpg", userType: "moderator", feedingStations: [], posts: ["3", "6", "9"]
},
{
    _id: 4, username: "breado", password: "bread123", fullname: "breado bread", mail: "bread@b.com", createdAt: 1778841205000,
    birthday: 1021669200000, profilePicURL: "../design/images/profile pictures/man_2.jpg", userType: "feeder", feedingStations: [{ _id: 1, status: "owner" }], posts: []
}]

const chats = [{
    _id: "1", chatName: "tuxedo owners", chatLogo: "", chatters: ["1", "3"],
    messages: [{ _id: "1", text: "hey" }, { _id: "3", text: "hey" }, { _id: "1", text: "how are you doing?" }],
    createdAt: 1767564832000
}]

const communities = [
    {
        _id: 1,
        communityName: "Meower Haven",
        communityLogo: "",
        communityBakcground: "",
        ownerId: 1,
        moderators: [2],
        members: [1, 2, 4],
        posts: [1, 3],
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10
    },
    {
        _id: 2,
        communityName: "Purrfect Coders",
        communityLogo: "",
        communityBakcground: "",
        ownerId: 4,
        moderators: [1, 3],
        members: [4, 1, 3],
        posts: [2, 4, 5],
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 200
    },
    {
        _id: 3,
        communityName: "Whisker Warriors",
        communityLogo: "",
        communityBakcground: "",
        ownerId: 2,
        moderators: [],
        members: [2, 3],
        posts: [6],
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 400
    },
    {
        _id: 4,
        communityName: "Claw & Order",
        communityLogo: "",
        communityBakcground: "",
        ownerId: 3,
        moderators: [4],
        members: [3, 4],
        posts: [7, 8],
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 600
    },
    {
        _id: 5,
        communityName: "Catnip Collective",
        communityLogo: "",
        communityBakcground: "",
        ownerId: 1,
        moderators: [],
        members: [1, 4],
        posts: [9],
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 800
    },
    {
        _id: 6,
        communityName: "Feline Fitness Club",
        communityLogo: "",
        communityBakcground: "",
        ownerId: 4,
        moderators: [],
        members: [4],
        posts: [10],
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1000
    },
    {
        _id: 7,
        communityName: "Memeow Cinema",
        communityLogo: "",
        communityBakcground: "",
        ownerId: 2,
        moderators: [4],
        members: [2, 4],
        posts: [1, 5],
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1100
    },
    {
        _id: 8,
        communityName: "Startup Cats",
        communityLogo: "",
        communityBakcground: "",
        ownerId: 3,
        moderators: [1],
        members: [3, 1],
        posts: [2, 6],
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1200
    },
    {
        _id: 9,
        communityName: "Book of Paws",
        communityLogo: "",
        communityBakcground: "",
        ownerId: 1,
        moderators: [2],
        members: [1, 2],
        posts: [3, 7],
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1500
    },
    {
        _id: 10,
        communityName: "Random Meowments",
        communityLogo: "",
        communityBakcground: "",
        ownerId: 2,
        moderators: [],
        members: [2, 3, 4],
        posts: [4, 8, 9],
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 900
    }
]

let userId = 4 // in this case

function Main() {
    //renderPosts()
    updateMainContent()
    renderCommunities()
    // queryFromBackend()
    // postByIdFromBackend("5")
}

export function renderPosts(list) { // function that renders updates posts
    // console.log(list)
    console.log("posts rendered")
    const postsContainer = document.getElementById("posts-container") // creates a 'pointer' to the container so we could interract with it
    if (list != null) {

        postsContainer.innerHTML = list.map(post => {
            const liked = isLiked(post.id, userId) // checks is each post is liked by the loggedin user

            const poster = users.find(user => user._id === post.user_id)
            // console.log(poster)
            return `
            <div class="post-box">
                <div class="post-header">
                           <a href="../htmls/profile.html?id=${post.user_id}" class="post-user">
                           <img src="${poster.profilePicURL}" />
                           </a> 
                           <div class="post-header-right">
                           <div class="left">
                               <div class="post-user-name">${poster.fullname}</div>
                               <div class="post-title">${post.title}</div>
                           </div>
                           <div class="right">
                           <div class="post-date">${getTimeAgo(SQLTimestampToTimestamp(post.created_at))}</div>
                           <button class="remove-post-btn" data-id="${post.id}">X</button>
                           </div>
                           </div>
                       </div>
                       <div class="post-description">${post.description}</div>
                       ${post.media_type !== "none"
                    ? `<div class="post-media">
                               ${post.media_type === "image"
                        ? `<img class="post-image" src="${post.media_url}" />`
                        : `<video class="post-video" controls src="${post.media_url}"></video>`
                    }
                </div>`: ""}
                <div class="post-footer">
                  <div class="like-btn" data-id="${post.id}">
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

    const userCommunities = communities.filter(c => {
        return(
            c.ownerId === userId ||
            c.moderators.includes(userId) ||
            c.members.includes(userId)
        )
    }
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

// function alterPosts(value = sortMethod) { // function to sort / filter posts
//     const storedPosts = [...posts]
//     let alteredPosts // variable for posts to alter
//     if (value === sortMethod) return

//     switch (value) { // checks the value of the chosen input radio button

//         case "new":
//             sortMethod = "new"
//             alteredPosts = [...storedPosts].sort((a, b) => b.createdAt - a.createdAt) // + = true so it sorts if gap in time is smaller because today < yestarday
//             break                                                               // the bigger the timestamp, the more time had passed

//         case "old":
//             sortMethod = "old"
//             alteredPosts = [...storedPosts].sort((a, b) => a.createdAt - b.createdAt) // - = false, does the opposite of the other sort
//             break

//         case "day":
//             sortMethod = "day"
//             alteredPosts = [...storedPosts].filter(post =>                            // filters based on value, timestamp is in miliseconds so 1=1 milisecond, 1000 = 1 second, 60000 = minute
//                 post.createdAt >= Date.now() - (1000 * 60 * 60 * 24))           // 3,600,000 = hour, that x 24 = day
//             break

//         case "week":
//             sortMethod = "week"
//             alteredPosts = [...storedPosts].filter(post =>                            // filters the same way but now day x 7 = week
//                 post.createdAt >= Date.now() - (1000 * 60 * 60 * 24 * 7))
//             break

//         case "month":
//             sortMethod = "month"
//             alteredPosts = [...storedPosts].filter(post =>                            // filters the same way but now day x 30 = month
//                 post.createdAt >= Date.now() - (1000 * 60 * 60 * 24 * 30))
//             break
//     }
//     handleSortChange(value)
//     postsForRender = [...alteredPosts]                                        // updates the list we use, not database itself
//     renderPosts(alteredPosts)
//     // showToast(`sorted / filtered by ${value}`,"main")
//     // console.log(`sorted / filtered by ${value}`)
// }

function isLiked(postId, userId = userId) { // checks if post with id = postId is liked by user with id = Userid
    const post = query().find(p => p._id === postId);
    return post ? post.likedByUsers.includes(userId) : false;
}

function likePost(postId) {
    if (!postId) return;

    toggleLike(postId, userId);

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

    const sortRadio = document.getElementById(currentSort);
    if (sortRadio) sortRadio.checked = true;

    const postsToRender = await queryFromBackend(currentSort)

    renderPosts(postsToRender)

    const user = users.find(user => user._id === userId);
    document.getElementById("input-post-profile-picture").src = user.profilePicURL;
}
