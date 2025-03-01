input.onButtonPressed(Button.A, function () {
    // Move right
    moveCursor(false)
})
// buffer[ship[0]][ship[1]] = true
function newGame () {
    // Buffer is a boolean[5][5] matrix.  We're initializing using a literal because of limitations of the JavaScript engine (i.e no support for Array constructor).
    buffer = [
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
    ship = [randint(0, buffer.length - 1), randint(0, buffer[0].length - 1)]
    buffer[cursor[0]][cursor[1]] = true
}
// We use a separate LED output buffer for smooth/flickerless rendering.
function renderBuffer () {
    for (let x = 0; x <= buffer.length - 1; x++) {
        for (let y = 0; y <= buffer[x].length - 1; y++) {
            if (buffer[x][y]) {
                led.plot(x, y)
            } else {
                led.unplot(x, y)
            }
        }
    }
}
input.onButtonPressed(Button.B, function () {
    // Move down
    moveCursor(true)
})
function moveCursor (rightDown: boolean) {
    buffer[cursor[0]][cursor[1]] = false
    cursor[rightDown ? 0 : 1] = (cursor[rightDown ? 0 : 1] + 1) % (rightDown ? buffer.length : buffer[0].length)
    buffer[cursor[0]][cursor[1]] = true
}
let ship: number[] = []
let cursor: number[] = []
let buffer: boolean[][] = []
newGame()
basic.forever(function () {
    renderBuffer()
    // This controls the speed of the game
    basic.pause(500)
})
