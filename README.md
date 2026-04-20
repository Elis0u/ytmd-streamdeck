# ytmd-streamdeck

> A Stream Deck plugin to control [YouTube Music Desktop App](https://github.com/ytmdesktop/ytmdesktop) directly from your Stream Deck.

> ⚠️ **Work in progress** — Only Play/Pause is available for now. More controls coming soon.

***

## Features

- ⏯️ **Play / Pause** — Toggle playback with a single button press
- ⏭️ Next track *(coming soon)*
- ⏮️ Previous track *(coming soon)*
- 🔊 Volume control *(coming soon)*
- ❤️ Like / Dislike *(coming soon)*

***

## Requirements

- [Elgato Stream Deck](https://www.elgato.com/stream-deck) hardware
- [Stream Deck software](https://www.elgato.com/downloads) 7.1+
- [YouTube Music Desktop App](https://github.com/ytmdesktop/ytmdesktop) v2.x with the **Companion Server** feature enabled

### Enable Companion Server in YouTube Music Desktop

1. Open YouTube Music Desktop App
2. Go to **Settings** → **Integrations** → enable **Companion Server**
3. Make sure it runs on port `9863` (default)

***

## Installation

### From source

```bash
git clone https://github.com/Elis0u/ytmd-streamdeck.git
cd ytmd-streamdeck
npm install
npm run build
```

Then copy or symlink the `com.elis0u.ytm-desktop-controls.sdPlugin` folder to your Stream Deck plugins directory:

**Windows:**
```
%appdata%\Elgato\StreamDeck\Plugins\
```

**macOS:**
```
~/Library/Application Support/com.elgato.StreamDeck/Plugins/
```

Restart Stream Deck after copying.

***

## Authentication

The plugin uses the Companion Server authentication flow:

1. Add a **Play/Pause** button to your Stream Deck
2. Press it — the button will display `auth...` then show a **6-digit code**
3. In YouTube Music Desktop App, go to **Settings → Integrations → Companion Server → Manage access**
4. Approve the request using the displayed code
5. Done — the button is now authenticated and ready to use

The token is stored securely in Stream Deck's global settings and persists across restarts.

***

## Development

```bash
npm install       # Install dependencies
npm run watch     # Watch and recompile on file changes
```

After each change, reload the plugin in Stream Deck:
- Right-click the plugin in Stream Deck → **Reload Plugin**

Logs are available at:
```
%appdata%\Elgato\StreamDeck\Plugins\com.elis0u.ytm-desktop-controls.sdPlugin\logs\
```

***

## Project Structure

```
src/
├── plugin.ts                  # Entry point — registers all actions
├── ytm-client.ts              # Shared API logic (auth, commands)
└── actions/
    └── play-pause.ts          # Play/Pause action
com.elis0u.ytm-desktop-controls.sdPlugin/
├── manifest.json              # Plugin manifest
├── imgs/                      # Icons
└── bin/                       # Compiled JS (generated)
```

***

## License

MIT