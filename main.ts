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
    if (nPlayers > 1) {
        radio.setTransmitSerialNumber(true)
        radio.setGroup(RADIO_GROUP)
        // Handshake
        radio.sendString('null')
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
    radio.sendString(JSON.stringify({ c: cursor }))
    switch (mode) {
        case MODES.ATTACK:
            attack()
            break

        case MODES.PLACE:
            place()
            break

        case MODES.WAIT:
            break

    }

})

function attack() {
    music.play(music.createSoundExpression(WaveShape.Sine, 5000, 979, 255, 255, 2000, SoundExpressionEffect.None, InterpolationCurve.Linear), music.PlaybackMode.UntilDone)
    if (cursor[0] == ship[0] && cursor[1] == ship[1]) {
        // hit
        music.play(music.createSoundExpression(WaveShape.Square, 43, 43, 255, 255, 1000, SoundExpressionEffect.Vibrato, InterpolationCurve.Linear), music.PlaybackMode.UntilDone)
        music._playDefaultBackground(music.builtInPlayableMelody(Melodies.PowerUp), music.PlaybackMode.UntilDone)
        newGame()
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

// 19 characters max
radio.onReceivedString(function (receivedString) {
    let serialNumber = radio.receivedPacket(RadioPacketProperty.SerialNumber)
    // Is this is a feedback loop?
    if (serialNumber === SERIAL_NUMBER) {
        // There's nothing to do
        return
    }

    let receivedObject = JSON.parse(receivedString)
    // Is receivedObject empty?
    if (!receivedObject) {
        // There's nothing to do
        return
    }

    console.log({ serialNumber, receivedObject })
    if (receivedObject.c) {
        console.log(receivedObject.c)
    }
})

/**
 * Move cusor right or down
 * @param rightDown
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

let MODES = {
    NEW: 0,
    ATTACK: 1,
    WAIT: 2,
    PLACE: 3
}
let LED_BUFFER_WIDTH = 5
let LED_BUFFER_HEIGHT = 5
let RADIO_GROUP = 3
let SERIAL_NUMBER: number = control.deviceSerialNumber()
let LOOP_DELAY = 500


//
// Declare dynamic variables
//
let mode: number = MODES.PLACE
let cursor: number[] = []
let ship: number[] = []
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
