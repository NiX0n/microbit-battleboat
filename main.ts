/**
 * https://github.com/NiX0n/microbit-battleboat
 * 
 * @TODO
 * - Add bomb receiver mode/UX
 * - Add blink hold on fire sequence, etc
 * - Add user-switchable nPlayers
 */

/**
 * Start New Game
 */
function newGame() {
    newLedBuffer()
    cursor = [0, 0]
    ship = [randint(0, ledBuffer.length - 1), randint(0, ledBuffer[0].length - 1)]
    nPlayers = 2
    mode = MODES.ATTACK

    if (nPlayers > 1) {
        radio.setTransmitSerialNumber(true)
        radio.setGroup(RADIO_GROUP)
        // Handshake
        radioSendObject(null)
        mode = MODES.PLACE
    }

    // Debug hint
    console.log(JSON.stringify(ship))

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
            ledBuffer[x1].push(false)
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
    moveCursor(false)
})

input.onButtonPressed(Button.B, function () {
    // Move down
    moveCursor(true)
})

input.onButtonPressed(Button.AB, function () {
    switch (mode) {
        case MODES.ATTACK:
            attack()
            break

        case MODES.PLACE:
            place()
            break

        case MODES.DEFEND_WAIT:
            break

    }

})

input.onLogoEvent(TouchButtonEvent.Pressed, function () {
    mode = MODES.DEFEND_WAIT
    console.log(`${SERIAL_NUMBER} is in DEFEND_WAIT`)
})

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

function isHit(location: number[])
{
    return location[0] == ship[0] && location[1] == ship[1]
}

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

function place() {
    // Set ship to cursor location
    // Use slice() to get copy of array
    // Instead of object refrence
    ship = cursor.slice()
    music.play(music.createSoundExpression(WaveShape.Sine, 3527, 4126, 255, 255, 500, SoundExpressionEffect.Vibrato, InterpolationCurve.Linear), music.PlaybackMode.UntilDone)
    mode = MODES.ATTACK
}

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


    // switch game mode
    // not to be confused with packet mode
    switch (mode) {
        case MODES.ATTACK:
            console.log(`${SERIAL_NUMBER} in attack mode for some reason`)
            break

        case MODES.ATTACK_WAIT:
            if (receivedObject.m != MODES.DEFEND_WAIT) {
                console.error(`receivedObject has invalid mode`)
                return
            }
            console.log(`${SERIAL_NUMBER} attack success? ${receivedObject.h ? 'yes' : 'no'}`)
            notifyAttack(receivedObject.h)
            if (receivedObject.h) {
                newGame()
                break
            }
            mode = MODES.ATTACK
            break

        case MODES.DEFEND_WAIT:
            if (receivedObject.m != MODES.ATTACK) {
                console.error(`receivedObject has invalid mode`)
                return
            }
            console.log(`${SERIAL_NUMBER} is hit? ${isHit(receivedObject.c) ? 'yes' : 'no'}`)
            radioSendObject({
                m: MODES.DEFEND_WAIT,
                h: isHit(receivedObject.c),
                c: receivedObject.c
            })
            console.log(`${SERIAL_NUMBER} sent attack response`)
            break
    }
}


/**
 * Move cusor right or down
 * @param {boolean} rightDown
 *      false: right,
 *      true: down
 */
function moveCursor(rightDown: boolean) {
    ledBuffer[cursor[0]][cursor[1]] = false
    cursor[rightDown ? 0 : 1] = (cursor[rightDown ? 0 : 1] + 1) % (rightDown ? ledBuffer.length : ledBuffer[0].length)
}

/**
 * BLINK! BLINK! BLINK!
 */
function blinkCursor() {
    ledBuffer[cursor[0]][cursor[1]] = !ledBuffer[cursor[0]][cursor[1]]
}

//
// Declare pseudo-constants
//

enum MODES {
    NEW,
    ATTACK,
    ATTACK_WAIT,
    DEFEND_WAIT,
    PLACE
}
let LED_BUFFER_WIDTH = 5
let LED_BUFFER_HEIGHT = 5
let RADIO_GROUP = 3
let SERIAL_NUMBER: number = control.deviceSerialNumber()
let MAX_PACKET_LENGTH: number = 19
let LOOP_DELAY = 500


//
// Declare dynamic variables
//
let mode: number = MODES.NEW
let cursor: number[] = []
let ship: number[] = []

/**
 * rxBuffer handles single streams from multiple devices
 * indexed by serial number
 */
let rxBuffer: string[] = []

let ledBuffer: boolean[][] = []
let nPlayers: number = 0

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
    // This controls the speed of the game
    basic.pause(LOOP_DELAY)
})
