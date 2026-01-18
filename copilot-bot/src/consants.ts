export const COPILOT_ICON =
    "https://registry.npmmirror.com/@lobehub/icons-static-png/1.29.0/files/dark/copilot-color.png";

export const COPILOT_WEB_LINK = "https://copilot.microsoft.com";
export const COPILOT_ANDRIOD_LINK = "https://play.google.com/store/apps/details?id=com.microsoft.copilot";
export const COPILOT_IOS_LINK = "https://apps.apple.com/at/app/microsoft-copilot/id6472538445";

export const MESSAGE = `Hello, if you want to continue using Microsoft Copilot, please visit [copilot.microsoft.com](<${COPILOT_WEB_LINK}/>) or download the mobile app today for [Android](<${COPILOT_ANDRIOD_LINK}/>) or [iOS](<${COPILOT_IOS_LINK}/>) devices.`;

const { CLIENT_ID, BOT_TOKEN, OPENROUTER_KEY } = process.env;

if (!CLIENT_ID || !BOT_TOKEN || !OPENROUTER_KEY) {
    console.error("Please provide all of the following environment variables: CLIENT_ID, BOT_TOKEN, OPENROUTER_KEY");
    process.exit(1);
}

export const clientId = CLIENT_ID;
export const token = BOT_TOKEN;
export const openRouterKey = OPENROUTER_KEY;
