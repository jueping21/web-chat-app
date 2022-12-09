// Elements
const messageForm = document.querySelector('#message-form')
const messageFormInput = messageForm.querySelector('input')
const messageFormButton = messageForm.querySelector('button')
const sendLocationButton = document.querySelector('#send-location')
const messages = document.querySelector('#messages')
const loading = document.querySelector('.loading')
const chatView = document.querySelector('.chat')

// Templates
const userMessageTemplate = document.querySelector('#user-message-template').innerHTML
const adminMessageTemplate = document.querySelector('#admin-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
// TODO: implement a parser  
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

document.title = `${username}-${room}`;

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

const messageControl = (message) => {
    if (message.system) {
        const adminhtml = Mustache.render(adminMessageTemplate, {
            message: message.text,
            createdAt: moment(message.createdAt).format('h:mm a')
        })
        messages.insertAdjacentHTML('beforeend', adminhtml)
    } else {
        const html = Mustache.render(userMessageTemplate, {
            username: message.username,
            message: message.text,
            createdAt: moment(message.createdAt).format('h:mm a')
        })

        messages.insertAdjacentHTML('beforeend', html)
        if (message.username == username) {
            messages.lastElementChild.style.backgroundColor = "#EEE8F8";
            messages.lastElementChild.style.marginLeft = "auto";
        }
    }
    autoscroll()
}

const roomControl = (roomInfo) => {
    const room = roomInfo.room;
    const users = roomInfo.users;
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
}

const joinAckCallback = (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
}

const sendAckCallback = (error) => {
    messageFormButton.removeAttribute('disabled')
    messageFormInput.value = ''
    messageFormInput.focus()
    if (error) {
        alert(error)
        location.href = '/'
    }
}

const succeed = () => {
    loading.style.display = "none";
    chatView.style.display = "flex";
}

const failed = () => {
    alert("Time out")
    location.href = '/'
}

const socket = io();
const chat = new Loader(socket).loadSocket(10000)
chat.then(value => {
    loading.style.display = "none";
    chatView.style.display = "flex";
    value.waitMessage(messageControl);
    value.waitRoomInfo(roomControl);
    value.joinChat({ username, room }, joinAckCallback);
    messageForm.addEventListener('submit', (e) => {
        e.preventDefault()
        messageFormButton.setAttribute('disabled', 'disabled')
        const message = e.target.elements.message.value
        value.send(message, sendAckCallback)
    })

}, failed => {
    alert("Time out")
    location.href = '/'
})