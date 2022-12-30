const nickname = Qs.parse(location.search, { ignoreQueryPrefix: true }).nickname;
//FIXME:DEBUG
const room = `Room-${Qs.parse(location.search, { ignoreQueryPrefix: true }).room}`;
const isCreate = Qs.parse(location.search, { ignoreQueryPrefix: true }).isCreate;

const token = localStorage.getItem(nickname);
document.title = `${nickname} - ${room}`;
const timeout = 5000;

const socket = io("http://localhost:3000/chat", { auth: { token } });

const socketPromise = new Promise((reslove, reject) => {
    socket.on("connect_error", (error) => {
        reject({code:800, data:"socket connection failed"});
    });

    socket.on("connected", (ack) => {
        reslove(ack);
    });
}).then(() => {
    return new Promise((reslove, reject) => {
        socket.emit("join", { username: nickname, room, isCreate}, (ack) => {
            if (ack.code == 200) {
                reslove(ack);
            } else {
                reject(ack);
            }
        });
    })
}, (reason) => {
    return Promise.reject(reason);
})

let timeoutPromise = new Promise((resovle, reject) => {
    setTimeout(() => {
        reject({code:800, data:"Request Time Out"});
    }, timeout);
})

Promise.race([socketPromise, timeoutPromise]).then(
    value => {
        updateSildbar(value.data);
        main();
    },
    reason => {
        alert(reason.data);
        if(reason.code == 800){
            location.href = "/";
        } else{
            location.href = `/home?nickname=${nickname}`;
        }
    }
)

const createMessageTemplate = (message) => {
    if(message.system){
        const date = moment(message.createdAt).format('h:mm a');
        const text = message.text;
    
        const adminMessage = document.createElement("span");
        adminMessage.setAttribute("class", "admin-message__content");
        adminMessage.innerHTML = `${text} -- ${date}`;
    
        const div = document.createElement("div");
        div.setAttribute("class", "admin-message");
        div.append(adminMessage)
        return div;

    }else{
        const username = message.username;
        const date = moment(message.createdAt).format('h:mm a');
        const text = message.text;
    
        const spanName = document.createElement("span");
        const spanMeta = document.createElement("span");

        spanName.setAttribute("class", "user-message__name");
        spanMeta.setAttribute("class", "user-message__meta");

        spanName.innerHTML = username;
        spanMeta.innerHTML = date;

        const div1 = document.createElement("div");
        div1.appendChild(spanName);
        div1.appendChild(spanMeta);

        const div2 = document.createElement("div");
        div2.setAttribute("class", "user-message__content");   
        div2.innerHTML = text;
        
        const template = document.createElement("div")
        template.setAttribute("class", "user-message");
        template.appendChild(div1);
        template.appendChild(div2);
        return template;
    }
} 

const sildbarTemplate = (message)=>{
    const h2 = document.createElement("h2");
    h2.setAttribute("class", "room-title");
    h2.innerHTML = message.room;

    const h3 = document.createElement("h3");
    h3.setAttribute("class", "list-title");
    h3.innerHTML = "User List:";

    const ul = document.createElement("ul");
    ul.setAttribute("class", "users-title");

    for(let i = 0; i < message.users.length; i++){
        const li = document.createElement("li");
        li.innerHTML = message.users[i];
        ul.appendChild(li)
    }
    const div = document.createElement("div")
    div.appendChild(h2);
    div.appendChild(h3);
    div.appendChild(ul);
    return div;
}

const updateSildbar = (message)=>{
    const sidebar = document.querySelector('#sidebar')
    const template = sildbarTemplate(message);
    sidebar.innerHTML = "";
    sidebar.append(template);
}

const main = () => {
    const messageForm = document.querySelector('#message-form')
    const messageFormInput = messageForm.querySelector('input')
    const messageFormButton = messageForm.querySelector('button')
    const messages = document.querySelector('#messages')

    const loading = document.querySelector('.loading')
    const chatView = document.querySelector('.chat')
    loading.style.display = "none";
    chatView.style.display = "flex";


    const autoscroll = () => {
        // New message element
        const newMessage = messages.lastElementChild
        // Height of the new message
        const newMessageStyles = getComputedStyle(newMessage)
        const newMessageMargin = parseInt(newMessageStyles.marginBottom)
        const newMessageHeight = newMessage.offsetHeight + newMessageMargin
        // Visible height
        const visibleHeight = messages.offsetHeight
        // Height of messages container
        const containerHeight = messages.scrollHeight
        // How far have I scrolled?
        const scrollOffset = messages.scrollTop + visibleHeight
        if (containerHeight - newMessageHeight <= scrollOffset) {
            messages.scrollTop = messages.scrollHeight
        }
    }

    socket.on("message", (message) => {
        const template = createMessageTemplate(message);
        if (message.username == nickname){
            template.style.backgroundColor = "#EEE8F8";
            template.style.marginLeft = "auto";
        }
        messages.append(template);
        autoscroll();
    })

    socket.on("roomData", (message) => {
        const template = sildbarTemplate(message);
        sidebar.innerHTML = "";
        sidebar.append(template);
    });

    messageForm.addEventListener('submit', (event) => {
        event.preventDefault()
        messageFormButton.setAttribute('disabled', 'disabled')
        const message = event.target.elements.message.value

        let timeoutPromise = new Promise((resovle, reject) => {
            setTimeout(() => {
                reject({code:800, data:"Timeout for sending message. Please rejoin the room"});
            }, timeout);
        });

        let sendPromise = new Promise((resovle, reject) => {
            socket.emit("sendMessage", message, (ack) => {
                messageFormButton.removeAttribute('disabled')
                messageFormInput.value = ''
                messageFormInput.focus()
                if (ack.code == 800) {
                    reject(ack);
                }else{
                    resovle(ack);
                }
            })
        });

        Promise.race([sendPromise, timeoutPromise]).then(
            value => {},
            reason => {
                alert(reason.data);
                location.href = `/home?nickname=${nickname}`;
            }
        )

    })
}
