/**
 * https://github.com/NiX0n/microbit-battleboat
 * 
 * @TODO
 * - Add defend wait mode/UX
 * - Add turn negotiation
 * - Add turn cycle
 * - Add audio on newGame()/place mode
 * - Add audio on 2p+ turn start
 * - Add blink hold on fire sequence, etc
 * - Add user-switchable nPlayers
 * - Add user-switchable radio group
 */

/**
 * Start New Game.
 * Reset game environment back to initial state.
 */
function newGame() {
    newLedBuffer()
    cursor = [0, 0]

    // Is this a multiplayer game?
    if (nPlayers > 1) {
        radio.setTransmitSerialNumber(true)
        radio.setGroup(RADIO_GROUP)
        // Handshake
        radioSendObject(null)
        mode = MODES.PLACE

        // skip the rest
        return
    }
    
    // This is a single player game

    // Randomly place ship
    ship = [randint(0, ledBuffer.length - 1), randint(0, ledBuffer[0].length - 1)]
    // Go directly to ATTACK mode
    mode = MODES.ATTACK

    // @TODO DELETEME
    console.log(`Hint: ${JSON.stringify(ship)}`)
}

/**
 * Construct ledBuffer boolean[5][5] matrix.
 * We use a separate LED output buffer for smooth/flickerless rendering.
 */
function newLedBuffer() {
    ledBuffer = []
    // We're initializing using for loops because of limitations of the JavaScript engine (i.e no support for Array constructor).
    for (let x1 = 0; x1 <= LED_BUFFER_WIDTH - 1; x1++) {
        ledBuffer.push([])
        for (let y1 = 0; y1 <= LED_BUFFER_HEIGHT - 1; y1++) {
            ledBuffer[x1].push(defaultLedState)
        }
    }
}

/**
 * Render ledBuffer.
 */
function renderLedBuffer() {
    for (let x = 0; x <= ledBuffer.length - 1; x++) {
        for (let y = 0; y <= ledBuffer[x].length - 1; y++) {
            if (ledBuffer[x][y]) {
                led.plot(x, y)
            } else {
                led.unplot(x, y)
            }
        }
    }
}

input.onButtonPressed(Button.A, function () {
    // Move right
    moveCursor(true)
})

input.onButtonPressed(Button.B, function () {
    // Move down
    moveCursor(false)
})

input.onButtonPressed(Button.AB, function () {
    switch (mode) {
        case MODES.ATTACK:
            attack()
            break

        case MODES.PLACE:
            place()
            break

        case MODES.DEFEND:
            break

    }

})

/**
 * We need some way to put one of the devices in this mode for debugging
 * @TODO Remove after turn negotiation implemented
 */
input.onLogoEvent(TouchButtonEvent.Pressed, function () {
    mode = MODES.DEFEND
    console.log(`${SERIAL_NUMBER} is in DEFEND mode`)
})

/**
 * Attack opponent
 */
function attack() {
    if(nPlayers > 1)
    {
        radioSendObject({ m: MODES.ATTACK, c: cursor })
        mode = MODES.ATTACK_WAIT
        return
    }

    notifyAttack(isHit(cursor))
    newGame()
}

/**
 * Is this the location of the ship?
 * @param {number[2]} location
 */
function isHit(location: number[])
{
    return location[0] == ship[0] && location[1] == ship[1]
}

/**
 * Let the user know that there's been an attack
 * @param {boolean} isHitted whether the attack was successful
 */
function notifyAttack(isHitted: boolean)
{
    music.play(music.createSoundExpression(WaveShape.Sine, 5000, 979, 255, 255, 2000, SoundExpressionEffect.None, InterpolationCurve.Linear), music.PlaybackMode.UntilDone)
    if (isHitted) {
        // hit
        music.play(music.createSoundExpression(WaveShape.Square, 43, 43, 255, 255, 1000, SoundExpressionEffect.Vibrato, InterpolationCurve.Linear), music.PlaybackMode.UntilDone)
        music._playDefaultBackground(music.builtInPlayableMelody(Melodies.PowerUp), music.PlaybackMode.UntilDone)
    } else {
        // miss
        music._playDefaultBackground(music.builtInPlayableMelody(Melodies.Wawawawaa), music.PlaybackMode.UntilDone)
    }
}

/**
 * Place ship
 */
function place() {
    // Set ship to cursor location
    // Use slice() to get copy of array
    // Instead of object refrence
    ship = cursor.slice()
    // Give feedback to user that this is different from an attack
    music.play(music.createSoundExpression(WaveShape.Sine, 3527, 4126, 255, 255, 500, SoundExpressionEffect.Vibrato, InterpolationCurve.Linear), music.PlaybackMode.UntilDone)
    mode = MODES.ATTACK
}

/**
 * Send object serialized in JSON format over radio.
 * Chunks message into parts if over MAX_PACKET_LENGTH.
 * @param {any} obj Object to be sent over radio
 */
function radioSendObject(obj: any) {
    let data = JSON.stringify(obj);
    if (data.length > MAX_PACKET_LENGTH) {
        // If data is too long
        // Wrap it in control characters
        data = `\x02${data}\x03`
    }
    // Then chunk the string up and send it
    for (let p = 0; p < data.length; p += MAX_PACKET_LENGTH) {
        radio.sendString(data.substr(p, MAX_PACKET_LENGTH))
    }
}

radio.onReceivedString(function (receivedString) {
    let serialNumber = radio.receivedPacket(RadioPacketProperty.SerialNumber)
    console.log(`${SERIAL_NUMBER} received string '${receivedString}'`)
    // Did we just receive a packet from ourselves?
    if (serialNumber == SERIAL_NUMBER) {
        // Ignore it!
        return
    }
    // Initialize or append to receive buffer
    rxBuffer[serialNumber] = (rxBuffer[serialNumber] || "") + receivedString
    // Does the buffer start with an STX control character?
    if (rxBuffer[serialNumber].charCodeAt(0) == 2) {
        // Does the buffer end with an ETX control character?
        if (rxBuffer[serialNumber].charCodeAt(rxBuffer[serialNumber].length - 1) == 3) {
            // We're done; so we can strip the control characters off
            rxBuffer[serialNumber] = rxBuffer[serialNumber].slice(1, -1)
        }
        else {
            // We're NOT done; so don't parse and callback yet
            return;
        }
    }
    let receivedObject = JSON.parse(rxBuffer[serialNumber])
    // reset receive buffer
    rxBuffer[serialNumber] = ''
    onRadioReceivedObject(receivedObject, [undefined, serialNumber])
})

/**
 * @param {any} receivedObject
 * @param {number[]} props
 */
function onRadioReceivedObject(receivedObject: any, props: any[]) {
    let serialNumber = props[RadioPacketProperty.SerialNumber]
    if (!receivedObject) {
        console.log(`${SERIAL_NUMBER} received empty object from ${serialNumber}`)
        return
    }

    // log() for debugging
    console.log(receivedObject)
    if ((receivedObject || {}).c) {
        console.log(receivedObject.c)
    }


    // switch device game mode
    // validate sent packet mode
    // then call respective callback
    switch (mode) {
        case MODES.ATTACK:
            console.log(`${SERIAL_NUMBER} in attack mode for some reason`)
            break

        case MODES.DEFEND:
            if (receivedObject.m != MODES.ATTACK) {
                console.error(`receivedObject has invalid mode`)
                return
            }
            onReceivedAttack(receivedObject, props)
            break

        case MODES.ATTACK_WAIT:
            if (receivedObject.m != MODES.DEFEND) {
                console.error(`receivedObject has invalid mode`)
                return
            }
            onReceivedDefend(receivedObject, props)
            break
    }
}

function onReceivedAttack(receivedObject: any, props: any[]) {
    let serialNumber = props[RadioPacketProperty.SerialNumber]
    console.log(`${SERIAL_NUMBER} is hit? ${isHit(receivedObject.c) ? 'yes' : 'no'}`)
    radioSendObject({
        m: MODES.DEFEND,
        h: isHit(receivedObject.c),
        c: receivedObject.c
    })
    console.log(`${SERIAL_NUMBER} sent attack response`)
}

function onReceivedDefend(receivedObject: any, props: any[]) {
    let serialNumber = props[RadioPacketProperty.SerialNumber]
    console.log(`${SERIAL_NUMBER} attack success? ${receivedObject.h ? 'yes' : 'no'}`)
    notifyAttack(receivedObject.h)
    if (receivedObject.h) {
        newGame()
        return
    }
    mode = MODES.ATTACK
}


/**
 * Move cusor right or down
 * @param {boolean} rightDown
 *      false: right,
 *      true: down
 */
function moveCursor(rightDown: boolean) {
    ledBuffer[cursor[0]][cursor[1]] = defaultLedState
    cursor[rightDown ? 0 : 1] = (cursor[rightDown ? 0 : 1] + 1) % (rightDown ? ledBuffer.length : ledBuffer[0].length)
}

/**
 * BLINK! BLINK! BLINK!
 */
function blinkCursor() {
    ledBuffer[cursor[0]][cursor[1]] = isCursorDisabled ? defaultLedState : !ledBuffer[cursor[0]][cursor[1]]
}

//
// #region Declare pseudo-constants
//

/**
 * Game & Packet Mode States
 */
enum MODES {
    NEW,
    PLACE,
    ATTACK,
    ATTACK_WAIT,
    DEFEND
}

/**
 * Microbit v2 is 5 LEDs wide
 */
let LED_BUFFER_WIDTH = 5

/**
 * Microbit v2 is 5 LEDs wide
 */
let LED_BUFFER_HEIGHT = 5

/**
 * Radio Group must be same as other players
 */
let RADIO_GROUP = 3

/**
 * This device's serial number
 */
let SERIAL_NUMBER: number = control.deviceSerialNumber()

/**
 * Maximum string length supported by radio.sendString()
 */
let MAX_PACKET_LENGTH: number = 19

/**
 * Refresh rate of LED buffer render
 */
let LOOP_DELAY = 500

// #endregion

//
// #region Declare dynamic variables
//
/**
 * Game Mode
 */
let mode: MODES = MODES.NEW

/**
 * Ship Location [x, y]
 */
let ship: number[] = []

/**
 * Cursor Location [x, y]
 */
let cursor: number[] = []

/**
 * Is cursor hidden from user
 */
let isCursorDisabled: boolean = false

/**
 * boolean[5][5] matrix
 */
let ledBuffer: boolean[][] = []

/**
 * Initial value of all entries in ledBuffer
 */
let defaultLedState = false

/**
 * rxBuffer handles single streams from multiple devices
 * indexed by serial number
 */
let rxBuffer: string[] = []

/**
 * Number of Players
 * @TODO Replace hard value w/ user input
 */
let nPlayers: number = 2

// #endregion

//
// Initialize
//
newGame()


/**
 * Loop mostly drives LEDs
 */
basic.forever(function () {
    blinkCursor()
    renderLedBuffer()
    basic.pause(LOOP_DELAY)
})
