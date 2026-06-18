import { showToast } from './toast.js'
import { generateId } from './helper.js'
import { saveArrayToStorage, getArrayFromStorage } from '../javascript/helper.js'
import axios from 'axios'

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

let userId = "4"

let usersKey = "users"
let postsKey = "posts"

// ✅ load ONCE only (no repeated localStorage reads)
// let posts = getArrayFromStorage("posts", defaultPosts);

let posts = []

// async function initPosts() {
//     posts = await queryFromBackend()
//     renderPosts()
// }

// initPosts()

// cached query result (optional optimization)
let cache = {
    sort: null,
    result: null
};

// =====================
// QUERY (no storage access)
// =====================
export function query(value) {
    if (cache.sort === value && cache.result) {
        return cache.result;
    }

    const storedPosts = [...posts];
    let result;

    switch (value) {
        case "new":
            result = storedPosts.sort((a, b) => b.createdAt - a.createdAt);
            break;

        case "old":
            result = storedPosts.sort((a, b) => a.createdAt - b.createdAt);
            break;

        case "day":
            result = storedPosts.filter(p =>
                p.createdAt >= Date.now() - 86400000
            );
            break;

        case "week":
            result = storedPosts.filter(p =>
                p.createdAt >= Date.now() - 86400000 * 7
            );
            break;

        case "month":
            result = storedPosts.filter(p =>
                p.createdAt >= Date.now() - 86400000 * 30
            );
            break;

        default:
            result = storedPosts;
    }

    cache.sort = value;
    cache.result = result;

    return result;
}

export async function queryFromBackend(value = "") {
    try {
        const res = await axios.get("http://localhost:3000/api/posts", {
            params: { sort: value }
        });

        console.log("🔥 BACKEND POSTS:", res.data);
        return res.data;

    } catch (err) {
        console.log("❌ Backend query failed:", err);
        return null;
    }
}

export async function postByIdFromBackend(value = "") {
    try {
        const res = await axios.get(`http://localhost:3000/api/posts/${value}`, {
            params: { postid: value }
        });

        console.log("🔥 BACKEND POSTS:", res.data);
        return res.data;

    } catch (err) {
        console.log("❌ Backend query failed:", err);
        return null;
    }
}

export async function createPostAndPutInBackend() {
    const titleEl = document.getElementById("post-title-input")
    const descEl = document.getElementById("post-descrption-input")

    const title = titleEl.value.trim()
    const desc = descEl.value.trim()

    if (!title) {
        showToast("missing title", "main");
        return;
    }

    if (!desc) {
        showToast("missing description", "main");
        return;
    }

    const newPost = {
        _id: generateId(),
        _userid: userId,
        title,
        description: desc,
        mediaType: "none",
        mediaUrl: "",
        likedByUsers: [],
        createdAt: Date.now()
    };

    try {
        const res = await axios.put("http://localhost:3000/api/posts",
            newPost
        )

        console.log("🔥 CREATED POST:", res.data)

        titleEl.value = ""
        descEl.value = ""

        return res.data
    }
    catch (err) {
        console.log("❌ Backend create failed:", err)
        return null
    }

    posts.push(newPost);

    // sync ONCE
    saveArrayToStorage("posts", posts);

    // reset cache because data changed
    cache.result = null;
    cache.sort = "none";

    showToast(`created post [${newPost._id}]`, "main");
}

// =====================
// CREATE POST
// =====================
export function createPost() {
    const titleEl = document.getElementById("post-title-input")
    const descEl = document.getElementById("post-descrption-input")

    const title = titleEl.value.trim()
    const desc = descEl.value.trim()

    if (!title) {
        showToast("missing title", "main");
        return;
    }

    if (!desc) {
        showToast("missing description", "main");
        return;
    }

    const newPost = {
        _id: generateId(),
        _userid: userId,
        title,
        description: desc,
        mediaType: "none",
        mediaUrl: "",
        likedByUsers: [],
        createdAt: Date.now()
    };

    posts.push(newPost);

    // sync ONCE
    saveArrayToStorage("posts", posts);

    // reset cache because data changed
    cache.result = null;
    cache.sort = "none";

    titleEl.value = "";
    descEl.value = "";

    showToast(`created post [${newPost._id}]`, "main");
}

// =====================
// DELETE POST
// =====================
export function deletePost(postId = "") {
    if (!postId) {
        showToast("invalid post", "main");
        return;
    }

    const post = posts.find(p => p._id === postId);

    if (!post) {
        showToast("post not found", "main");
        return;
    }

    if (post._userid !== userId) {
        showToast("not allowed", "main");
        return;
    }

    posts = posts.filter(p => p._id !== postId);

    saveArrayToStorage("posts", posts);

    // invalidate cache only
    cache.result = null;

    showToast(`deleted post [${postId}]`, "main");
}

export function toggleLike(postId, userId) {
    const post = posts.find(p => p._id === postId);
    if (!post) return;

    const liked = post.likedByUsers.includes(userId);

    if (liked) {
        post.likedByUsers = post.likedByUsers.filter(id => id !== userId);
    } else {
        post.likedByUsers.push(userId);
    }

    saveArrayToStorage("posts", posts);
}