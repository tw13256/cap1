const socket = io('http://localhost:3000')
//================================================================
const messageContainer = document.getElementById('message-container')
const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')
const videoGrid = document.getElementById('video-grid')
//畫面直播
const videoElement = document.querySelector('video#player')
//
const User_name = prompt('What is your name?')
appendMessage('You joined')
// socket.emit('new-user', User_name)
console.log('script start')
console.log(User_name)
// socket.on('new-user',User_name =>{
//   appendMessage(User_name)
//   console.log(User_name)
// })
socket.on('chat-message', data => {
  appendMessage(`${data.name}: ${data.message}`)
  console.log(data)
})

socket.on('user-connected__', User_name => {
  appendMessage(`${User_name} connected`)
  console.log(User_name)
})

socket.on('user-disconnected', User_name => {
  appendMessage(`${User_name} disconnected`)
})

messageForm.addEventListener('submit', e => {
  e.preventDefault()
  const message = messageInput.value
  //appendMessage(`You: ${message}`)
  socket.emit('send-chat-message', message)
  messageInput.value = ''
})

function appendMessage(message) {
  const messageElement = document.createElement('div')
  messageElement.innerText = message
  messageContainer.append(messageElement)
}


//================================================================
//分想直播
// function start() {
//   if (window.stream) {
//     window.stream.getTracks().forEach((track) => {
//       track.stop()
//     })
//   }
//   const constraints = {
//     frameRate: 15,
//     width: 640,
//     height: 360,
//   }
//   navigator.mediaDevices
//     .getDisplayMedia(constraints)
//     .then(gotStream)
//     .catch(handleError)
// }
//btnShare.onclick = start

//
const myPeer = new Peer(undefined, {
  host: '/',
  port: '3001'
})
const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream, 'self')
  myPeer.on('call', call => {
    console.log('peer connected')
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream, call.peer)
    })
  })

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream)
    // username ok
    console.log('User connected',User_name)
  })
  socket.on('new-user',User_name =>{
    appendMessage(User_name)
     console.log(User_name)
   })
})

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
  // console.log(`peerId: ${id}`)
  socket.emit('join-room', ROOM_ID, id)
  socket.emit('new-user', User_name)
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream, call.peer)
  })
  peers[userId] = call
}

function addVideoStream(video, stream, peerId) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
  socket.once('remove-video-' + peerId, () => {
    // console.log(`${peerId}: 移除video`)
    video.remove()
  })
}