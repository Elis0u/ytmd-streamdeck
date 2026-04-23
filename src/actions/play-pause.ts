import streamDeck, { action, KeyDownEvent, PropertyInspectorDidAppearEvent, SendToPluginEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import type { JsonValue } from "@elgato/utils";
import { authenticate, getPlaylists, getState, getToken, sendCommand } from "../ytm-client";

interface PlayPauseSettings {
    [key: string]: JsonValue;
    fallbackPlaylistId?: string;
    fallbackPlaylistTitle?: string;
}

@action({ UUID: "com.elis0u.ytm-desktop-controls.playpause" })
export class PlayPause extends SingletonAction<PlayPauseSettings> {

    override async onWillAppear(ev: WillAppearEvent<PlayPauseSettings>): Promise<void> {
        await ev.action.setImage("imgs/actions/play");
    }

    override async onKeyDown(ev: KeyDownEvent<PlayPauseSettings>): Promise<void> {
        let token = await getToken();

        if (!token) {
            token = await authenticate(ev.action);
            await ev.action.setTitle("");
            await ev.action.setImage("imgs/actions/play");
            if (!token) return;
        }

        // Vérifier si une musique est déjà chargée
        const { fallbackPlaylistId } = ev.payload.settings;
        let hasTrack = false;

        try {
            const state = await getState(token);
            const video = state?.player?.video;
            const hasQueue = state?.player?.queue?.items?.length > 0;
            hasTrack = !!video || hasQueue;
        } catch (error) {
            streamDeck.logger.warn("Failed to get state, falling back to playPause", error);
            hasTrack = true; // En cas d'erreur, on tente quand même playPause
        }

        if (!hasTrack && fallbackPlaylistId) {
            // Rien de chargé → lancer la playlist par défaut
            streamDeck.logger.info(`[PlayPause] No track loaded, starting fallback playlist ${fallbackPlaylistId}`);
            await sendCommand(token, "changeVideo", { videoId: null, playlistId: fallbackPlaylistId });
        } else {
            await sendCommand(token, "playPause");
        }
    }

    override async onPropertyInspectorDidAppear(_ev: PropertyInspectorDidAppearEvent<PlayPauseSettings>): Promise<void> {
        const token = await getToken();
        if (!token) return;

        try {
            const playlists = await getPlaylists(token);
            await streamDeck.ui.sendToPropertyInspector({ playlists });
        } catch (error) {
            streamDeck.logger.error("Failed to load playlists", error);
        }
    }

    override async onSendToPlugin(ev: SendToPluginEvent<{ event: string }, PlayPauseSettings>): Promise<void> {
        if ((ev.payload as { event?: string }).event !== "refreshPlaylists") return;

        const token = await getToken();
        if (!token) return;

        try {
            const playlists = await getPlaylists(token);
            await streamDeck.ui.sendToPropertyInspector({ playlists });
        } catch (error) {
            streamDeck.logger.error("Failed to refresh playlists", error);
        }
    }
}
