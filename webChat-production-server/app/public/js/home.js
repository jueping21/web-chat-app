const recmURL = "http://localhost:28000/rooms"
const socketURL = "http://localhost:28000/chat"
const chatURL = "http://localhost:29000/chat"
const timeout = 10000;
const { nickname } = Qs.parse(location.search, { ignoreQueryPrefix: true })
const token = localStorage.getItem(nickname);
document.title = nickname + "'s home"

const socket = io(socketURL, { auth: { token } });

// connect to socket
let socketPromise = new Promise((resovle, reject) => {
    socket.on("connect_error", async (error) => {
        reject("Please login");
    });

    socket.on("connected", function (data) {
        resovle(recmURL);
    })
}).then(async (url) => {
    let result = await getRequest(url, token);
    if (result.code == 200 && result.data.isAuth) {
        return Promise.resolve(result.data.room);
    } else {
        return Promise.reject("Cannot load rooms. Please re-login");
    }
})

let timeoutPromise = new Promise((resovle, reject) => {
    setTimeout(() => {
        reject("Request Time Out");
    }, timeout);
})

/**
 * Room manager - Management rooms on the home page
 */
let grid = document.getElementById("grid-container");
const addRoomToScreen = (roomName) => {
    const gridItem = document.createElement("div");
    gridItem.setAttribute("id", `grid-item`);
    gridItem.setAttribute("class", `grid-item `);
    const atag = document.createElement("a");
    atag.setAttribute("target", "_blank")
    //FIXME:DEBUG
    const chatRoomName = roomName.replace("Room-", "");
    atag.setAttribute(
        "href",
        `${chatURL}?nickname=${nickname}&room=${chatRoomName}&isCreate=0`
    );
    atag.setAttribute(
        "class",
        `link`
    );
    atag.innerHTML = roomName;
    gridItem.appendChild(atag);
    grid.appendChild(gridItem);
}

let logoutBtn = document.getElementById("logout-btn");
let createBtn = document.getElementById("create-btn");
let closeBtn = document.getElementById("close-btn");
let joinBtn = document.getElementById("join-btn");
let nicknameH2 = document.getElementById("nickname");
let roomInputName = document.getElementById("room-input");
let loading = document.getElementById('loading');
let navBar = document.getElementById('nav-bar');
let home = document.getElementById("home-index");
let form = document.getElementById("centered-form");

nicknameH2.innerHTML = nickname;

Promise.race([socketPromise, timeoutPromise]).then(rooms => {
    grid.innerHTML = "";
    for (let i = 0; i < rooms.length; i++) {
        addRoomToScreen(rooms[i]);
    }

    logoutBtn.addEventListener("click", (event) => {
        if (confirm("Are you sure to logout?")) {
            socket.emit("logout", { token });
            localStorage.removeItem(nickname)
            location.href = "/";
        }
    })

    joinBtn.addEventListener("click", (event) => {
        if (roomInputName.value == "") {
            alert("Room name cannot be empty");
        } else {
            window.open(
                `${chatURL}?nickname=${nickname}&room=${roomInputName.value}&isCreate=1`,
                '_blank'
            );
            home.style.display = "block";
            form.style.display = "none";
        }
    })

    createBtn.addEventListener("click", (event) => {
        home.style.display = "none";
        form.style.display = "flex";
    })

    closeBtn.addEventListener("click", (event) => {
        home.style.display = "block";
        form.style.display = "none";
    })

    navBar.style.display = "flex";
    home.style.display = "block";
    loading.style.display = "none";

}, (error) => {
    location.href = "/";
    alert(error);
});