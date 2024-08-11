const socket = new WebSocket('ws://danbotlab.local:8080');
function send_info() {
    const textbox_contents = document.getElementById('textbox').value;
    socket.send(textbox_contents);
}
function send_this(msg) {
    socket.send(msg);
}
function send_cmd(msg) {
    socket.send('{"cmd":"'+msg+'"}')
}
socket.addEventListener('open', (event) => {
    console.log('WebSocket connection opened:', event);
});


// Event listener for when a message is received from the server
socket.addEventListener('message', (event) => {
    console.log('Message from server:', event.data);
    document.getElementById('result').textContent = event.data;
    let response = {}
    try {
       response = JSON.parse(event.data);
       if (response.hasOwnProperty("plays")){
            document.getElementById("play_space").textContent = response.plays;
       }
    }catch(error){
        if (error instanceof SyntaxError){
            console.log("incorrect parse" + event.data)
        }
        console.error("Unexpected error", error)
    }
});

// Event listener for when the connection is closed
socket.addEventListener('close', (event) => {
    console.log('WebSocket connection closed:', event);
});

// Event listener for errors
socket.addEventListener('error', (event) => {
    console.error('WebSocket error:', event);
});