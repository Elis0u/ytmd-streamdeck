import streamDeck from "@elgato/streamdeck";

import { Next } from "./actions/next";
import { NowPlaying } from "./actions/now-playing";
import { PlaylistSelector } from "./actions/playlist-selector";
import { PlayPause } from "./actions/play-pause";
import { Previous } from "./actions/previous";
import { Shuffle } from "./actions/shuffle";

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel("trace");

// Register the increment action.
streamDeck.actions.registerAction(new PlayPause());
streamDeck.actions.registerAction(new Next());
streamDeck.actions.registerAction(new Previous());
streamDeck.actions.registerAction(new Shuffle());
streamDeck.actions.registerAction(new PlaylistSelector());
streamDeck.actions.registerAction(new NowPlaying());

// Finally, connect to the Stream Deck.
streamDeck.connect();
