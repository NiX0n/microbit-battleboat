> Open this page at [https://nix0n.github.io/microbit-battleboat/](https://nix0n.github.io/microbit-battleboat/)

# Micro:bit Battleboat
An implementation of the classic [Battleship game](https://en.wikipedia.org/wiki/Battleship_(game)) for play on one more more BBC Micro:bits.

## Objective
Sink your opponent's boat.  

### Similarities to Battleship
Game is played similar to Battleship, however it's distinct in that it is only played on a 5x5 grid; as opposed to 10x10 in the original.  Because of this limited space, to maintain a statistical challenge, only one 1x1 ship is placed per player per game; as opposed to 10 variable length ships in the original.

Specifically, the odds of any one turn resulting in a hit is 4%; whereas, in the original the odds are 34%.

## Gameplay

#### Controls

| Input     | Action           |
| --------- | ---------------- |
| **Reset** | Reset Game |
| **Logo**  | Start/Stop Join Mode |
|  **A**    | Move Cusor Right |
|  **B**    | Move Cusor Down  |
| **A+B**   | Place Ship/FIRE! |

### Single Player (1P) Game
By default, when the device is reset, the game is in 1P mode.

1. A ship is randomly placed on the board
2. Hunt and fire on the ship
3. Press **A** OR **B** button to choose your target
4. Press **A** AND **B** buttons at the same time to FIRE!

### Multi-Player (2P/MP) Game
In theory any number of players can play together.  This game has only been tested with two players.

#### Joining Players
1. Press **Logo** to start JOIN for all players
2. Listen for notification for each player joined
3. Press **Logo** again once all players have joined

**Note**: This will end your 1P game.  If you wish to go back to a 1P game, simply **Reset** the device.

**Known Bug**: Occasionally one of the devices will fail on step #3.  If this happens, simply restart the devices and try again.

#### Playing
1. Start each game by selecting the placement of your battleboat. (See: Controls)
2. A player is randomly chosen to go first attacking, while the other(s) go on defense
3. Take turns firing on your opponent's ship.   (See: Controls)
4. The player who sinks their opponent's ship wins
5. Start a new game.  Winner goes first

## Hardware Requirements
 * A [BBC Micro:bit v2](https://en.wikipedia.org/wiki/Micro_Bit)
 * More BBC Micro:bit v2s for multiple players

## Import This Project

To import this repository in MakeCode.

* open [https://makecode.microbit.org/](https://makecode.microbit.org/)
* click on **Import** then click on **Import URL**
* paste **https://github.com/nix0n/microbit-battleboat** and click import

## Other

### License
This code is made available under the [the MIT License](LICENSE).

#### Metadata (used for search, rendering)

* for PXT/microbit
<script src="https://makecode.com/gh-pages-embed.js"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>