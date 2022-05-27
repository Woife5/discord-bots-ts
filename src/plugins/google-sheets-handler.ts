import { Config } from '@helpers';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

const { GOOGLE_SHEET_ID } = process.env;

const GOOGLE_CREDENTIALS_KEY = 'google-sheets-credentials';
const GOOGLE_TOKENS_KEY = 'google-sheets-tokens';

const GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets',
];

async function authorize() {
    const cred = await Config.findOne({ key: GOOGLE_CREDENTIALS_KEY }).exec();
    const toke = await Config.findOne({ key: GOOGLE_TOKENS_KEY }).exec();

    if (!cred?.value || !toke?.value) {
        throw new Error('No valid credentials found!');
    }

    const credentials = JSON.parse(cred.value);
    const tokens = JSON.parse(toke.value);

    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    oAuth2Client.setCredentials(tokens.tokens);
    return oAuth2Client;
}

async function writeData(auth: OAuth2Client, values: string[][], range: string) {
    try {
        const sheets = google.sheets({ version: 'v4', auth });

        const res = await sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEET_ID,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
        });

        console.log('Stat-backup complete, updated cells: %s', res.data.updates?.updatedRange);
    } catch (err) {
        console.error(err);
    }
}

export async function saveGlobalData(data: any[][]) {
    try {
        const auth = await authorize();
        writeData(auth, data, 'raw-data!A1');
    } catch (err) {
        console.error(err);
    }
}

export async function saveTarotData(data: any[][]) {
    try {
        const auth = await authorize();
        writeData(auth, data, 'raw-tarot-data!A1');
    } catch (err) {
        console.error(err);
    }
}

export async function saveUserData(data: any[][]) {
    try {
        const auth = await authorize();
        writeData(auth, data, 'raw-user-data!A1');
    } catch (err) {
        console.error(err);
    }
}

export async function getTokenUrl() {
    try {
        const credentials = await Config.findOne({ key: GOOGLE_CREDENTIALS_KEY }).exec();

        if (!credentials?.value) {
            return;
        }

        const parsed = JSON.parse(credentials.value);

        const { client_secret, client_id, redirect_uris } = parsed.installed;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        return oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: GOOGLE_SCOPES,
        });
    } catch {
        console.error('something went wrong!');
    }
}

export async function setNewToken(code: string) {
    const credentials = await Config.findOne({ key: GOOGLE_CREDENTIALS_KEY }).exec();

    if (!credentials?.value) {
        return;
    }

    const parsed = JSON.parse(credentials.value);

    const { client_secret, client_id, redirect_uris } = parsed.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    const token = await oAuth2Client.getToken(code);

    // Store token
    await Config.updateOne(
        { key: GOOGLE_TOKENS_KEY },
        { $set: { value: JSON.stringify(token) } },
        { upsert: true }
    ).exec();

    return true;
}

export async function backup() {}
