import streamDeck from "@elgato/streamdeck";

const APP_ID = "ytmstreamdeck";
export const BASE = "http://localhost:9863/api/v1";

export async function getToken(): Promise<string | undefined> {
    const settings = await streamDeck.settings.getGlobalSettings<{ token?: string }>();
    return settings.token;
}

export async function sendCommand(token: string, command: string, data?: Record<string, unknown>): Promise<void> {
    await fetch(`${BASE}/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token },
        body: JSON.stringify({ command, ...(data && { data }) })
    });
}

export async function getPlaylists(token: string): Promise<Array<{ id: string; title: string }>> {
    const res = await fetch(`${BASE}/playlists`, {
        headers: { "Authorization": token }
    });
    return res.json();
}

export async function getState(token: string): Promise<any> {
    const res = await fetch(`${BASE}/state`, {
        headers: { "Authorization": token }
    });
    return res.json();
}

export async function imageToBase64(imageUrl: string): Promise<string> {
    try {
        const res = await fetch(imageUrl);
        const buffer = await res.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
        return "";
    }
}

export async function authenticate(action: any): Promise<string | undefined> {
    await action.setTitle("auth...");
    const codeRes = await fetch(`${BASE}/auth/requestcode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: APP_ID, appName: "YTM Stream Deck", appVersion: "1.0.0" })
    });
    const { code } = await codeRes.json() as { code: string };
    await action.setTitle(`code:\n${code}`);
    await new Promise(resolve => setTimeout(resolve, 15000));
    const tokenRes = await fetch(`${BASE}/auth/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: APP_ID, code })
    });
    const { token } = await tokenRes.json() as { token: string };
    await streamDeck.settings.setGlobalSettings({ token });
    return token ?? undefined;
}