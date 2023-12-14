const socket = new WebSocket('ws://' + location.host + '/command');

function sendCmd(cmd) {
    console.log("Going " + cmd)
    socket.send(cmd);
}

// Debug
socket.addEventListener('message', ev => {
    console.log(message)
});

// On Screen Controls
document.getElementById('left').onclick = ev => {
    ev.preventDefault();
    sendCmd("left")
};

document.getElementById('right').onclick = ev => {
    ev.preventDefault();
    sendCmd("right");
};

document.getElementById('up').onclick = ev => {
    ev.preventDefault();
    sendCmd("up");
};

document.getElementById('down').onclick = ev => {
    ev.preventDefault();
    sendCmd("down");
};

// WASD
document.addEventListener('keydown', function (event) {
    if (event.code === 'KeyW') {
        sendCmd('up');
    } else if (event.code === 'KeyA') {
        sendCmd('left');
    } else if (event.code === 'KeyS') {
        sendCmd('down');
    } else if (event.code === 'KeyD') {
        sendCmd('right');
    } else if (event.code === 'Enter') {
        return;
    }
});