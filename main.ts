/**
 * https://github.com/NiX0n/microbit-battleboat
 * @TODO
 * - Add ship placment mode/UX
 * - Add bomb receiver mode/UX
 */
function newGame () {
    // Buffer is a boolean[5][5] matrix.  We're initializing using a literal because of limitations of the JavaScript engine (i.e no support for Array constructor).
    ledBuffer = [
    [
    false,
    false,
    false,
    false,
    false
    ],
    [
    false,
    false,
    false,
    false,
    false
    ],
    [
    false,
    false,
    false,
    false,
    false
    ],
    [
    false,
    false,
    false,
    false,
    false
    ],
    [
    false,
    false,
    false,
    false,
    false
    ]
    ]
    cursor = [0, 0]
    ship = [randint(0, ledBuffer.length - 1), randint(0, ledBuffer[0].length - 1)]
    nPlayers = 2
    if(nPlayers > 1)
    {
        radio.setGroup(RADIO_GROUP)
        // Handshake
        radio.sendString('null')
    }

    // Debug hint
    console.log(JSON.stringify(ship))

    //console.log(`\x02${JSON.stringify({ id, cursor })}\x02`)

    // Buffer stuff
    ledBuffer[cursor[0]][cursor[1]] = true

}
// We use a separate LED output buffer for smooth/flickerless rendering.
function renderLedBuffer () {
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
input.onButtonPressed(Button.AB, function () {
    radio.sendString(JSON.stringify({c:cursor}))

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
})
// 19 characters max
radio.onReceivedString(function (receivedString) {
    let serialNumber = radio.receivedPacket(RadioPacketProperty.SerialNumber)
    // Is this is a feedback loop?
    if(serialNumber === SERIAL_NUMBER)
    {
        // There's nothing to do
        return
    }

    let receivedObject = JSON.parse(receivedString)
    // Is receivedObject empty?
    if(!receivedObject)
    {
        // There's nothing to do
        return
    }

    console.log({ serialNumber, receivedObject })
    if (receivedObject.c)
    {
        console.log(receivedObject.c)
    }
})

input.onButtonPressed(Button.A, function () {
    // Move right
    moveCursor(false)
})

input.onButtonPressed(Button.B, function () {
    // Move down
    moveCursor(true)
})

function moveCursor (rightDown: boolean) {
    ledBuffer[cursor[0]][cursor[1]] = false
    cursor[rightDown ? 0 : 1] = (cursor[rightDown ? 0 : 1] + 1) % (rightDown ? ledBuffer.length : ledBuffer[0].length)
}

function blinkCursor()
{
    ledBuffer[cursor[0]][cursor[1]] = !ledBuffer[cursor[0]][cursor[1]]
}

let RADIO_GROUP = 3
let SERIAL_NUMBER: number = control.deviceSerialNumber()
let cursor: number[] = []
let ship: number[] = []
let ledBuffer: boolean[][] = []
let nPlayers: number = 0
radio.setTransmitSerialNumber(true)
newGame()

basic.forever(function () {
    blinkCursor()
    renderLedBuffer()
    // This controls the speed of the game
    basic.pause(500)
})
