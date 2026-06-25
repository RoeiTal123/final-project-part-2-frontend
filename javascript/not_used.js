const chats = [{
    id: 1, chatName: "tuxedo owners", chatLogo: "", chatters: [1, 3],
    messages: [{ id: 1, text: "hey" }, { id: 3, text: "hey" }, { id: 1, text: "how are you doing?" }],
    createdAt: 1767564832000
}]

const communities = [
    {
        id: 1,
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
        id: 2,
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
        id: 3,
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
        id: 4,
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
        id: 5,
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
        id: 6,
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
        id: 7,
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
        id: 8,
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
        id: 9,
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
        id: 10,
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

function renderCommunities() {
    const container = document.querySelector(".communities-box")
    const loggedUser = getLoggedInUser()

    const userCommunities = communities.filter(c => {
        return (
            c.ownerId === loggedUser.id ||
            c.moderators.includes(loggedUser.id) ||
            c.members.includes(loggedUser.id)
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
        const role = getUserRole(c, loggedUser.id)

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