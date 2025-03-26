/**
 * https://github.com/NiX0n/microbit-battleboat
 * 
 * @TODO
 * - Add blink hold on fire sequence, etc
 * - Add user-switchable radio group
 * - Add wait for all ships placed
 * - Add history of attacks
 */

/**
 * Start New Game.
 * Reset game environment back to initial state.
 */
function newGame() {
    music._playDefaultBackground(music.builtInPlayableMelody(Melodies.JumpUp), music.PlaybackMode.UntilDone)
    newLedBuffer()
    cursor = [0, 0]
    // roll a giant dice to decide who goes first
    rochambeau[SERIAL_NUMBER] = randint(0, 2 ** 32)

    // Is this a multiplayer game?
    if (players.length > 1) {
        enableRadio()
        mode = MODES.PLACE
        defaultLedState = false
        isCursorDisabled = false
        newLedBuffer()

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
 * Proceed to the next turn
 * @param {number} step (default: 1) 
 *      Supports skips and/or player keeping turn.
 *      By defautlt, proceed to the next player in list.
 *      Wrap around player list in loop.
 */
function nextTurn(step: number = 1)
{
    // using modulo to wrap around
    playerTurn = (playerTurn + step) % players.length
    // Is it our turn?
    if (players[playerTurn] === SERIAL_NUMBER) {
        music.play(music.builtinPlayableSoundEffect(soundExpression.hello), music.PlaybackMode.UntilDone)
        mode = MODES.ATTACK
        defaultLedState = false
        isCursorDisabled = false
        newLedBuffer()
    }
    // It's somebody else's turn
    else {
        mode = MODES.DEFEND
        defaultLedState = true
        isCursorDisabled = true
        newLedBuffer()
    }
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

/**
 * Initialize and enable or disable radio
 * @param {boolean} isEnabled
 */
function enableRadio(isEnabled: boolean = true)
{
    if(isEnabled)
    {
        radio.on()
        radio.setTransmitSerialNumber(true)
        radio.setGroup(RADIO_GROUP)
        radio.setTransmitPower(RADIO_TX_POWER)
    }
    else
    {
        radio.off()
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

/**
 * Cursor Select
 */
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
 * Start/Stop JOIN mode
 */
input.onLogoEvent(TouchButtonEvent.Pressed, function () {
    console.log(`${SERIAL_NUMBER} logo pressed in mode=${mode}`)

    // @TODO Move into other functions
    if (mode != MODES.JOIN) {
        mode = MODES.JOIN
        enableRadio()
        defaultLedState = true
        isCursorDisabled = true
        newLedBuffer()
        music.play(music.stringPlayable("D C F - - - - - ", 240), music.PlaybackMode.UntilDone)
        notifyPlayerJoin()
    }
    else {
        music.play(music.stringPlayable("F D C - - - - - ", 240), music.PlaybackMode.UntilDone)
        defaultLedState = false
        isCursorDisabled = false

        if(players.length > 1)
        {
            players = players.sort((a, b) => {
                if(rochambeau[a] === rochambeau[b])
                {
                    // highly improbable condition 1/2^32
                    // fall back to who's is "younger"
                    return a < b ? -1 : 1
                }
                return rochambeau[a] < rochambeau[b] ? -1 : 1
            })
        }
        else
        {
            enableRadio(false)
        }

        newGame()
    }

})

/**
 * Send JOIN packet to other players
 */
function sendJoin()
{
    radioSendObject({
        m: MODES.JOIN,
        // include our random number that will
        // decide who will take their turn first
        // notably without any further negotiation
        r: rochambeau[SERIAL_NUMBER]
    })
}

/**
 * Let user know how many players have JOINed the game
 */
function notifyPlayerJoin() {
    for (let j = 0; j < players.length; j++) {
        music._playDefaultBackground(music.builtInPlayableMelody(Melodies.BaDing), music.PlaybackMode.InBackground)
    }
}

/**
 * Attack opponent
 */
function attack() {
    if (players.length > 1) {
        radioSendObject({ m: MODES.ATTACK, c: cursor })
        mode = MODES.ATTACK_WAIT
        return
    }
    let isHitted = isHit(cursor)
    notifyAttack(isHitted)
    if(isHitted)
    {
        newGame()
    }
}

/**
 * Is this the location of the ship?
 * @param {number[2]} location
 */
function isHit(location: number[]) {
    return location[0] == ship[0] && location[1] == ship[1]
}

/**
 * Let the user know that there's been an attack
 * @param {boolean} isHitted whether the attack was successful
 */
function notifyAttack(isHitted: boolean) {
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
    // don't advance player turn
    // just set up first turn
    // this may also have the added feature of keeping the winner's turn
    nextTurn(0)
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
    //console.log(`${SERIAL_NUMBER}->${serialNumber} received string '${receivedString}'`)
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
function onRadioReceivedObject(receivedObject: any, props: number[]) {
    let serialNumber = props[RadioPacketProperty.SerialNumber]
    if (!receivedObject) {
        console.log(`${serialNumber}->${SERIAL_NUMBER} received empty object`)
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
            console.log(`${serialNumber}->${SERIAL_NUMBER} in attack mode for some reason`)
            break

        case MODES.DEFEND:
            if (receivedObject.m != MODES.ATTACK) {
                console.error(`${serialNumber}->${SERIAL_NUMBER} receivedObject not in ATTACK mode`)
                return
            }
            onReceivedAttack(receivedObject, props)
            break

        case MODES.ATTACK_WAIT:
            if (receivedObject.m != MODES.DEFEND) {
                console.error(`${serialNumber}->${SERIAL_NUMBER} receivedObject not in DEFEND mode`)
                return
            }
            onReceivedDefend(receivedObject, props)
            break
        
        case MODES.JOIN:
            if (receivedObject.m != MODES.JOIN) {
                console.error(`${serialNumber}->${SERIAL_NUMBER} receivedObject not in JOIN mode`)
                return
            }
            onReceivedJoin(receivedObject, props)
            break
    }
}

/**
 * Handle attack received from other players
 * @param {any} receivedAttack
 * @param {any[]} props
 */
function onReceivedAttack(receivedAttack: any, props: number[]) {
    let serialNumber = props[RadioPacketProperty.SerialNumber]
    let isHitted = isHit(receivedAttack.c)
    console.log(`${SERIAL_NUMBER} is hit? ${isHitted ? 'yes' : 'no'}`)
    if (players[playerTurn] !== serialNumber)
    {
        // We're not going to do anything about it right now
        // @TODO Better handling
        console.error(`${SERIAL_NUMBER} was attacked by ${serialNumber} out of turn`)
    }

    radioSendObject({
        m: MODES.DEFEND,
        h: isHitted,
        c: receivedAttack.c
    })
    console.log(`${SERIAL_NUMBER} sent attack response`)

    // @TODO notifyAttack()
    if(isHitted) {
        newGame()
    }
    else {
        nextTurn()
    }
}

/**
 * Handle defense received back from other players that we attacked
 * @param {any} receivedAttack
 * @param {any[]} props
 */
function onReceivedDefend(receivedDefense: any, props: number[]) {
    let serialNumber = props[RadioPacketProperty.SerialNumber]
    console.log(`${SERIAL_NUMBER} attack success? ${receivedDefense.h ? 'yes' : 'no'}`)
    notifyAttack(receivedDefense.h)
    if (receivedDefense.h) {
        newGame()
        return
    }
    nextTurn()
}

/**
 * Handle join received from other player.
 * Add player seriao number to list,
 * and prepare to Rochambeau for first turn.
 * @param {any} receivedAttack
 * @param {any[]} props
 */
function onReceivedJoin(receivedJoin: any, props: number[]) {
    let serialNumber = props[RadioPacketProperty.SerialNumber]
    // For some reason this JavaScript implementation doesn't have Array.prototype.includes()
    if (players.indexOf(serialNumber) > -1)
    {
        // Player has already been registered
        return
    }

    console.log(`${serialNumber}->${SERIAL_NUMBER} JOIN`)
    players.push(serialNumber)
    rochambeau[serialNumber] = receivedJoin.r
    notifyPlayerJoin()
}


/**
 * Move cusor right or down
 * @param {boolean} rightDown
 *      false: right,
 *      true: down
 */
function moveCursor(rightDown: boolean) {
    if (isCursorDisabled) {
        return
    }
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
    DEFEND,
    JOIN
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
let RADIO_GROUP = 127

/**
 * Radio Transmit Power
 */
let RADIO_TX_POWER = 7

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
let rxBuffer: { [key: string]: string } = {}

/**
 * List of player device serial numbers
 */
let players = [SERIAL_NUMBER]

/**
 * Index of players current player
 */
let playerTurn = 0

/**
 * Random numbers that decide who goes first
 */
let rochambeau: { [key: string]: number } = {}

// #endregion

//
// Initialize
//
newGame()


/**
 * Loop mostly drives LEDs
 */
basic.forever(function () {
    switch (mode)
    {
        case MODES.JOIN:
            sendJoin()
            renderLedBuffer()
            basic.pause(4500)
            break
            
        default:
            blinkCursor()
            renderLedBuffer()
            basic.pause(LOOP_DELAY)
    }
})
