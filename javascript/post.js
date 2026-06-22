import { showToast } from './toast.js'
import { generateId } from './helper.js'
import { saveArrayToStorage, getArrayFromStorage, uploadToCloudinary } from '../javascript/helper.js'
import { httpService } from "./communication.js";
import { renderPosts } from './main.js';
import { selectedMediaFile, selectedMediaType, clearSelectedMedia } from "./media-state.js";

let userId = "4"

let postsKey = "posts"

let posts = []

// cached query result (optional optimization)
let cache = {
    sort: null,
    result: null
};

export async function queryFromBackend(value = "") {
    try {
        const res = await httpService.get(
            "posts",
            { sort: value }
        );

        console.log("🔥 BACKEND POSTS:", res);

        posts = res;
        renderPosts(posts)
        return res;

    } catch (err) {
        console.log("❌ Backend query failed:", err);
        return null;
    }
}

export async function postByIdFromBackend(postId) {
    try {
        const post = await httpService.get(`posts/${postId}`, "GET");

        console.log("🔥 BACKEND POST:", post);

        return post;

    } catch (err) {
        console.log("❌ Backend query failed:", err);
        return null;
    }
}

export async function createPostAndPutInBackend() {
    const titleEl = document.getElementById("post-title-input")
    const descEl = document.getElementById("post-description-input")

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

    let mediaUrl = null;
    let mediaPublicId = null;
    let mediaType = null;

    if (selectedMediaFile) {
        try {
            const upload = await uploadToCloudinary(selectedMediaFile);

            mediaUrl = upload.url;
            mediaPublicId = upload.publicId;
            mediaType = selectedMediaType;

        } catch (err) {
            console.log("upload failed:", err);
            showToast("media upload failed, posting without media", "main");

            // 🚨 DO NOTHING ELSE
            mediaUrl = null;
            mediaPublicId = null;
            mediaType = null;
        }
    }

    const newPost = {
        id: generateId(),
        user_id: Number(userId),
        title,
        description: desc,
        mediaType: mediaType,
        mediaUrl: mediaUrl,
        mediaPublicId: mediaPublicId,
        likedByUsers: [],
        createdAt: Date.now()
    };


    try {
        const createdPost = await httpService.post(
            "posts",
            newPost
        );

        console.log("🔥 CREATED POST:", createdPost);
        posts.push(newPost)
        renderPosts(posts)
        showToast(`created post [${newPost.id}]`, "main");

        titleEl.value = "";
        descEl.value = "";
        clearSelectedMedia();

        return createdPost;
    }
    catch (err) {
        console.log("❌ Backend create failed:", err);
        return null;
    }
}

export async function editPostAndPutInBackend(postId) {
    const titleEl = document.getElementById("post-title-input");
    const descEl = document.getElementById("post-description-input");

    const title = titleEl.value.trim();
    const desc = descEl.value.trim();

    if (!title) {
        showToast("missing title", "main");
        return null;
    }

    if (!desc) {
        showToast("missing description", "main");
        return null;
    }

    const originalIndex = posts.findIndex(p => p.id === postId);
    if (originalIndex === -1) return null;

    const originalPost = posts[originalIndex];

    // nothing changed check
    if (
        originalPost.title === title &&
        originalPost.description === desc
    ) {
        showToast("nothing changed, not saving", "main");
        return null;
    }

    // copy + overwrite
    const updatedPost = {
        ...originalPost,
        title: title,
        description: desc
    };

    // optimistic UI update
    posts[originalIndex] = { ...updatedPost };
    renderPosts(posts);

    showToast(`updated post [${postId}]`, "main");

    // reset UI
    titleEl.value = "";
    descEl.value = "";

    try {
        await httpService.put(`posts/${postId}`, updatedPost);

        showToast(`updated post [${postId}]`, "main");

        titleEl.value = "";
        descEl.value = "";

        return updatedPost;
    }
    catch (err) {
        console.log("❌ Backend update failed:", err);

        // rollback
        posts[originalIndex] = originalPost;
        renderPosts(posts);

        showToast("update failed", "main");
        return null;
    }
}

export async function deletePostFromBackend(postId) {
    const userid = Number(userId)
    if (!postId) {
        showToast("invalid post", "main");
        return;
    }

    const post = posts.find(p => {
        return p.id === postId
    });

    if (!post) {
        showToast("post not found", "main");
        return;
    }

    if (post.user_id !== userid) {
        showToast("not allowed", "main");
        return;
    }


    try {
        // 1. FIRST ask backend to delete post (it handles Cloudinary safely)
        const res = await httpService.delete(`posts/${postId}`);

        const data = res.data;

        // 2. ONLY proceed if backend confirms success
        if (!data?.success) {
            showToast("delete failed", "main");
            return null;
        }

        // 3. remove locally ONLY after confirmation
        posts = posts.filter(p => p.id !== postId);
        renderPosts(posts);

        console.log("🔥 DELETED POST:", data);
        showToast(`deleted post [${postId}]`, "main");

        return data;

    } catch (err) {
        console.log("❌ Backend delete failed:", err);
        showToast("delete failed", "main");
        return null;
    }
}

export async function thePosts() {
    if (!posts) return null
    return posts;
}

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

// =====================
// CREATE POST
// =====================
export function createPost() {
    const titleEl = document.getElementById("post-title-input")
    const descEl = document.getElementById("post-description-input")

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
        id: generateId(),
        user_id: userId,
        title,
        description: desc,
        mediaType: null,
        mediaUrl: null,
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

    showToast(`created post [${newPost.id}]`, "main");
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