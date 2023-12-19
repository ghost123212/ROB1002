const socket = new WebSocket('ws://' + location.host + '/command');

class JoystickController
{
    // stickID: ID of HTML element (representing joystick) that will be dragged
    // maxDistance: maximum amount joystick can move in any direction
    // deadzone: joystick must move at least this amount from origin to register value change
    constructor( stickID, maxDistance, deadzone )
    {
        this.id = stickID;
        let stick = document.getElementById(stickID);

        // location from which drag begins, used to calculate offsets
        this.dragStart = null;

        // track touch identifier in case multiple joysticks present
        this.touchId = null;
        
        this.active = false;
        this.value = { x: 0, y: 0 }; 

        let self = this;

        function handleDown(event)
        {
            self.active = true;

        // all drag movements are instantaneous
        stick.style.transition = '0s';

        // touch event fired before mouse event; prevent redundant mouse event from firing
        event.preventDefault();

            if (event.changedTouches)
            self.dragStart = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
            else
            self.dragStart = { x: event.clientX, y: event.clientY };

        // if this is a touch event, keep track of which one
            if (event.changedTouches)
            self.touchId = event.changedTouches[0].identifier;
        }
        
        function handleMove(event) 
        {
            if ( !self.active ) return;

            // if this is a touch event, make sure it is the right one
            // also handle multiple simultaneous touchmove events
            let touchmoveId = null;
            if (event.changedTouches)
            {
            for (let i = 0; i < event.changedTouches.length; i++)
            {
                if (self.touchId == event.changedTouches[i].identifier)
                {
                touchmoveId = i;
                event.clientX = event.changedTouches[i].clientX;
                event.clientY = event.changedTouches[i].clientY;
                }
            }

            if (touchmoveId == null) return;
            }

            const xDiff = event.clientX - self.dragStart.x;
            const yDiff = event.clientY - self.dragStart.y;
            const angle = Math.atan2(yDiff, xDiff);
        const distance = Math.min(maxDistance, Math.hypot(xDiff, yDiff));
        const xPosition = distance * Math.cos(angle);
        const yPosition = distance * Math.sin(angle);

        // move stick image to new position
            stick.style.transform = `translate3d(${xPosition}px, ${yPosition}px, 0px)`;

        // deadzone adjustment
        const distance2 = (distance < deadzone) ? 0 : maxDistance / (maxDistance - deadzone) * (distance - deadzone);
            const xPosition2 = distance2 * Math.cos(angle);
        const yPosition2 = distance2 * Math.sin(angle);
            const xPercent = parseFloat((xPosition2 / maxDistance).toFixed(4));
            const yPercent = parseFloat((yPosition2 / maxDistance).toFixed(4));
            
            self.value = { x: xPercent, y: yPercent };
        }

        function handleUp(event) 
        {
            if ( !self.active ) return;

            // if this is a touch event, make sure it is the right one
            if (event.changedTouches && self.touchId != event.changedTouches[0].identifier) return;

            // transition the joystick position back to center
            stick.style.transition = '.2s';
            stick.style.transform = `translate3d(0px, 0px, 0px)`;

            // reset everything
            self.value = { x: 0, y: 0 };
            self.touchId = null;
            self.active = false;
        }

        stick.addEventListener('mousedown', handleDown);
        stick.addEventListener('touchstart', handleDown);
        document.addEventListener('mousemove', handleMove, {passive: false});
        document.addEventListener('touchmove', handleMove, {passive: false});
        document.addEventListener('mouseup', handleUp);
        document.addEventListener('touchend', handleUp);
    }
}

let joystick1 = new JoystickController("stick1", 64, 8);

function sendCmd(cmd) {
    console.log("Going " + cmd)
    socket.send(cmd);
}

// Debug
socket.addEventListener('message', ev => {
    console.log(message)
});

document.getElementById('stop').onclick = ev => {
    ev.preventDefault();
    sendCmd("stop");
    document.getElementById("status2").innerText = "Drive: Stop";
};

document.getElementById('stop-mobile').onclick = ev => {
    ev.preventDefault();
    sendCmd("stop");
    document.getElementById("status2").innerText = "Drive: Stop";
};

function update()
{
    document.getElementById("status1").innerText = "Joystick 1: " + JSON.stringify(joystick1.value);
    /*
        -y == up
        +y == down
        -x == left
        +x == right
    */
   /*
        four movement commands, take circle of joystick as 360 deg so each movement command gets 90 deg each.
        stright up is 0 deg = forward so 90/2 deg left and right
        
        forward         315 to 45
        right           45 to 135
        backward        135 to 225
        left            225 to 315
   */
   /*
        eight movement commands, take circle of joystick as 360 deg so each movement command gets 45 deg each.
        stright up is 0 deg = forward so 45/2 deg left and right
        harder to implement
        
        forward         337.5 to 22.5
        forward-right   22.5 to 67.5
        right           67.5 to 112.5
        backward-right  112.5 to 157.5
        backward        157.5 to 202.5
        backward-left   202.5 to 247.5
        left            247.5 to 292.5
        forward-left    292.5 to 337.5
   */

    if (joystick1.value.y == 0.0)
    {
        sendCmd("stop")
        document.getElementById("status2").innerText = "Drive: Stop";
    }

    if (joystick1.value.y < 0 && Math.abs(joystick1.value.y) > Math.abs(joystick1.value.x))
    {
        sendCmd(`speed:${Math.abs(joystick1.value.y)}`);
        sendCmd("up")
        document.getElementById("status2").innerText = "Drive: Forward | Speed: " + JSON.stringify(Math.abs(joystick1.value.y));
    }
    
    if (joystick1.value.y > 0 && Math.abs(joystick1.value.y) > Math.abs(joystick1.value.x))
    {
        sendCmd(`speed:${Math.abs(joystick1.value.y)}`);
        sendCmd("down")
        document.getElementById("status2").innerText = "Drive: Backward | Speed: " + JSON.stringify(Math.abs(joystick1.value.y));
    }
    
    if (joystick1.value.x < 0 && Math.abs(joystick1.value.x) > Math.abs(joystick1.value.y))
    {
        sendCmd(`speed:${Math.abs(joystick1.value.x)}`);
        sendCmd("left")
        document.getElementById("status2").innerText = "Drive: Left | Speed: " + JSON.stringify(Math.abs(joystick1.value.x));
    }
    
    if (joystick1.value.x > 0 && Math.abs(joystick1.value.x) > Math.abs(joystick1.value.y))
    {
        sendCmd(`speed:${Math.abs(joystick1.value.x)}`);
        sendCmd("right")
        document.getElementById("status2").innerText = "Drive: Right | Speed: " + JSON.stringify(Math.abs(joystick1.value.x));
    }
}

function loop()
{
    requestAnimationFrame(loop);
    update();
}

loop();
