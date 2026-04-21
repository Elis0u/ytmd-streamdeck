import streamDeck, { action, KeyDownEvent, PropertyInspectorDidAppearEvent, SendToPluginEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import type { JsonValue } from "@elgato/utils";
import { authenticate, getPlaylists, getToken, sendCommand } from "../ytm-client";

interface PlaylistSettings {
    [key: string]: JsonValue;
    playlistId?: string;
    playlistTitle?: string;
}

const FONT_SIZE = 28;
const LINE_HEIGHT = FONT_SIZE + 6;

function buildImage(title: string): string {
    const words = title.split(" ");
    const totalH = words.length * LINE_HEIGHT;
    const startY = (144 - totalH) / 2 + FONT_SIZE;

    const lines = words.map((word, i) =>
        `<text x="72" y="${startY + i * LINE_HEIGHT}" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="${FONT_SIZE}" font-weight="bold">${word}</text>`
    ).join("");

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144"><rect width="144" height="144" fill="#1a1a1a"/>${lines}</svg>`;
}

@action({ UUID: "com.elis0u.ytm-desktop-controls.playlist-selector" })
export class PlaylistSelector extends SingletonAction<PlaylistSettings> {

    private async renderButton(action: any, title: string): Promise<void> {
        await action.setTitle("");
        await action.setImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildImage(title))}`);
    }

    override async onWillAppear(ev: WillAppearEvent<PlaylistSettings>): Promise<void> {
        const { playlistTitle } = ev.payload.settings;
        await this.renderButton(ev.action, playlistTitle ?? "Playlist");
    }

    override async onKeyDown(ev: KeyDownEvent<PlaylistSettings>): Promise<void> {
        let token = await getToken();
        if (!token) {
            token = await authenticate(ev.action);
            if (!token) return;
        }

        const { playlistId } = ev.payload.settings;
        if (!playlistId) {
            await this.renderButton(ev.action, "No playlist selected");
            return;
        }

        await sendCommand(token, "changeVideo", { videoId: null, playlistId });
    }

    override async onPropertyInspectorDidAppear(ev: PropertyInspectorDidAppearEvent<PlaylistSettings>): Promise<void> {
        const token = await getToken();
        if (!token) return;

        try {
            const playlists = await getPlaylists(token);
            await streamDeck.ui.sendToPropertyInspector({ playlists });
        } catch (error) {
            streamDeck.logger.error("Failed to load playlists", error);
        }
    }

    override async onSendToPlugin(ev: SendToPluginEvent<{ event: string }, PlaylistSettings>): Promise<void> {
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
