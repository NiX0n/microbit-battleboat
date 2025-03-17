> Open this page at [https://nix0n.github.io/microbit-battleboat/](https://nix0n.github.io/microbit-battleboat/)

# Micro:bit Battleboat
An implementation of the classic [Battleship game](https://en.wikipedia.org/wiki/Battleship_(game)) for play on one more more BBC Micro:bits.

## Objective
Sink your opponent's boat.

## Gameplay

#### Controls

| Input     | Action           |
| --------- | ---------------- |
| **Reset** | Reset Game |
| **Logo**  | Start/Stop Join Mode |
|  **A**    | Move Cusor Right |
|  **B**    | Move Cusor Down  |
| **A+B**   | Place Ship/FIRE! |

### Single Player Game
By default, when the device is reset, the game is in 1P mode.

1. A ship is randomly placed on the board
2. Hunt and fire on the ship

### Multi-Player Game
1. Press **Logo** to start JOIN for all players
2. Listen for notification for each player joined
3. Start each game by selecting the placement of your battleboat.
4. Take turns firing on your opponent's ship


## Hardware Requirements
 * A [BBC Micro:bit v2](https://en.wikipedia.org/wiki/Micro_Bit)
 * More BBC Micro:bit v2s for multiple players

## Import this project

To import this repository in MakeCode.

* open [https://makecode.microbit.org/](https://makecode.microbit.org/)
* click on **Import** then click on **Import URL**
* paste **https://github.com/nix0n/microbit-battleboat** and click import

#### Metadata (used for search, rendering)

* for PXT/microbit
<script src="https://makecode.com/gh-pages-embed.js"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>