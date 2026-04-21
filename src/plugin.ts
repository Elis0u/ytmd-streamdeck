import streamDeck from "@elgato/streamdeck";

import { Next } from "./actions/next";
import { PlayPause } from "./actions/play-pause";

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel("trace");

// Register the increment action.
streamDeck.actions.registerAction(new PlayPause());
streamDeck.actions.registerAction(new Next());

// Finally, connect to the Stream Deck.
streamDeck.connect();
