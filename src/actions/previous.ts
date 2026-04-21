import { action, KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { authenticate, getToken, sendCommand } from "../ytm-client";

@action({ UUID: "com.elis0u.ytm-desktop-controls.previous" })
export class Previous extends SingletonAction {

    override async onWillAppear(ev: WillAppearEvent): Promise<void> {
        await ev.action.setImage("imgs/actions/previous");
    }

    override async onKeyDown(ev: KeyDownEvent): Promise<void> {
        let token = await getToken();

        if (!token) {
            token = await authenticate(ev.action);
            await ev.action.setTitle("");
            await ev.action.setImage("imgs/actions/previous");
            return;
        }

        await sendCommand(token, "previous");
    }
}