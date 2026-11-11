# Kilder

| Hva | Kilde | Lisens | Hvor |
| --- | --- | --- | --- |
| Phaser 3.90.0 | <https://phaser.io> (hentet fra <https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js>) | MIT | `vendor/phaser.min.js` |
| 0x72 DungeonTileset II v1.7 | <https://0x72.itch.io/dungeontileset-ii> | CC0 | `assets/dungeon.png`, `assets/dungeon.json` |
| The Essential Retro Video Game Sound Effects Collection [512 sounds], Juhani Junkala | <https://opengameart.org/content/512-sound-effects-8-bit-style> | CC0 | `assets/lyd/*.wav` |
| Tiny Town 1.1, Kenney | <https://opengameart.org/content/tiny-town> (fra <https://kenney.nl>) | CC0 | `assets/ute.png` |
| Ninja Adventure Asset Pack, Pixel-boy og AAA (musikken `theme_lost_village`, `theme_swamp`, `theme_plain` og `theme_dream`) | <https://pixel-boy.itch.io/ninja-adventure-asset-pack> (filene hentet fra <https://github.com/pixel-boy/NinjaAdventure/tree/main/audio/music>) | CC0 | `assets/lyd/kjelleren.ogg`, `assets/lyd/dypet.ogg`, `assets/lyd/verden.ogg`, `assets/lyd/ishula.ogg` |

`assets/dungeon.json` lages fra pakkens `tile_list` med `node verktoy/lag-atlas.mjs <mappa med pakken>`.

Lydfilene har fått nye navn. Originalene: `treff` = `sfx_damage_hit3`, `tungt` = `sfx_sounds_impact5`, `magi` = `sfx_wpn_laser3`, `bom` = `sfx_sound_neutral1`, `au` = `sfx_sounds_damage1`, `seier` = `sfx_sounds_fanfare3`, `nivaa` = `sfx_sounds_fanfare1`, `kiste` = `sfx_coin_double1`, `drikk` = `sfx_sounds_powerup3`, `trapp` = `sfx_movement_stairs1a`, `svak` = `sfx_exp_short_hard8`, `preller` = `sfx_sounds_impact3`, `gull` = `sfx_coin_single1`, `bombe` = `sfx_exp_medium1`.
