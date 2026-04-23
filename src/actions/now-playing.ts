import streamDeck, { action, KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import type { JsonValue } from "@elgato/utils";
import { authenticate, getState, getToken, imageToBase64, sendCommand } from "../ytm-client";

interface NowPlayingSettings {
    [key: string]: JsonValue;
}

@action({ UUID: "com.elis0u.ytm-desktop-controls.now-playing" })
export class NowPlaying extends SingletonAction<NowPlayingSettings> {
    private updateInterval: NodeJS.Timeout | null = null;
    private lastStateHash: string = "";
    private currentAction: any = null;
    private token: string | undefined;

    override async onWillAppear(ev: WillAppearEvent<NowPlayingSettings>): Promise<void> {
        this.currentAction = ev.action;

        try {
            this.token = await getToken();
            if (!this.token) {
                this.token = await authenticate(ev.action);
            }
        } catch (error) {
            streamDeck.logger.error("Failed to get token on appear", error);
        }

        await new Promise(resolve => setTimeout(resolve, 100));

        await this.updateDisplay();
        this.updateInterval = setInterval(() => this.updateDisplay(), 3000);
    }

    override async onWillDisappear(): Promise<void> {
        if (this.updateInterval) clearInterval(this.updateInterval);
        this.currentAction = null;
    }

    override async onKeyDown(ev: KeyDownEvent<NowPlayingSettings>): Promise<void> {
        if (!this.token) {
            this.token = await getToken();
            if (!this.token) {
                this.token = await authenticate(ev.action);
            }
        }

        if (this.token) {
            await sendCommand(this.token, "playPause");
        }
    }

    private async updateDisplay(): Promise<void> {
        streamDeck.logger.info(`[NowPlaying] updateDisplay called. hasAction=${!!this.currentAction}, hasToken=${!!this.token}`);

        if (!this.currentAction || !this.token) {
            streamDeck.logger.warn("[NowPlaying] Missing action or token, aborting");
            return;
        }

        try {
            const state = await getState(this.token);

            if (state?.statusCode === 429) {
                streamDeck.logger.warn("[NowPlaying] Rate limited, will retry next cycle");
                return;
            }

            if (!state?.player) {
                streamDeck.logger.warn("[NowPlaying] No player in state");
                return;
            }

            let video = state.player.video;
            if (!video && state.player.queue?.items?.length) {
                const idx = state.player.queue.selectedItemIndex ?? 0;
                video = state.player.queue.items[idx];
            }

            if (!video) {
                streamDeck.logger.warn(`[NowPlaying] No video found. State keys: ${Object.keys(state.player).join(",")}`);
                return;
            }

            const stateHash = JSON.stringify({ v: video, p: state.player.trackState });
            if (stateHash === this.lastStateHash) {
                return;
            }
            this.lastStateHash = stateHash;

            const isPlaying = state.player.trackState === 1;
            streamDeck.logger.info(`[NowPlaying] Updating display: title=${video.title}, playing=${isPlaying}`);

            const title = video.title || "Unknown";
            const artist = video.author || video.artist || "Unknown";
            const thumbnail = video.thumbnails?.[video.thumbnails.length - 1]?.url ?? video.thumbnails?.[0]?.url;

            const titleLines = wrapText(title, 11);
            const artistTrim = artist.length > 14 ? artist.substring(0, 13) + "…" : artist;

            const titleSvg = titleLines.map((line, i) =>
                `<text x="72" y="${40 + i * 26}" text-anchor="middle" fill="#ffffff" font-size="24" font-weight="bold" font-family="Arial">${escapeXml(line)}</text>`
            ).join("");

            const artistY = 40 + titleLines.length * 26 + 6;
            const icon = isPlaying ? "⏸" : "▶";

            let imageData = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144">
                <rect width="144" height="144" fill="#1a1a1a"/>
                ${titleSvg}
                <text x="72" y="${artistY}" text-anchor="middle" fill="#cccccc" font-size="18" font-family="Arial">${escapeXml(artistTrim)}</text>
                <text x="72" y="138" text-anchor="middle" fill="#1db954" font-size="36" font-weight="bold">${icon}</text>
            </svg>`;

            if (thumbnail) {
                try {
                    const base64 = await imageToBase64(thumbnail);
                    if (base64) {
                        imageData = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144">
                            <image href="${base64}" width="144" height="144" preserveAspectRatio="xMidYMid slice"/>
                            <rect width="144" height="144" fill="#000000" fill-opacity="0.55"/>
                            ${titleSvg}
                            <text x="72" y="${artistY}" text-anchor="middle" fill="#ffffff" font-size="18" font-family="Arial">${escapeXml(artistTrim)}</text>
                            <text x="72" y="138" text-anchor="middle" fill="#1db954" font-size="36" font-weight="bold">${icon}</text>
                        </svg>`;
                    }
                } catch (imgError) {
                    streamDeck.logger.warn("Failed to load album art", imgError);
                }
            }

            await this.currentAction.setTitle("");
            await this.currentAction.setImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(imageData)}`);
        } catch (error) {
            streamDeck.logger.error("Failed to update now playing", error);
        }
    }
}

function escapeXml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxCharsPerLine: number, maxLines: number = 2): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
        if (!current) {
            current = word;
        } else if ((current + " " + word).length <= maxCharsPerLine) {
            current += " " + word;
        } else {
            lines.push(current);
            current = word;
            if (lines.length === maxLines - 1) break;
        }
    }
    if (current && lines.length < maxLines) lines.push(current);

    if (lines.length === maxLines && lines[maxLines - 1].length > maxCharsPerLine) {
        lines[maxLines - 1] = lines[maxLines - 1].substring(0, maxCharsPerLine - 1) + "…";
    }

    const usedWords = lines.join(" ").split(/\s+/).length;
    if (usedWords < words.length) {
        const last = lines[lines.length - 1];
        if (last.length + 1 <= maxCharsPerLine) {
            lines[lines.length - 1] = last + "…";
        } else {
            lines[lines.length - 1] = last.substring(0, maxCharsPerLine - 1) + "…";
        }
    }

    return lines;
}
