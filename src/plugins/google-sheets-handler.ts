import { Config, Stats, log, User } from '@helpers';
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

    const credentials = cred.value;
    const tokens = toke.value;

    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    oAuth2Client.setCredentials(tokens.tokens);
    return oAuth2Client;
}

async function writeData(auth: OAuth2Client, values: (string | number)[][], range: string) {
    try {
        const sheets = google.sheets({ version: 'v4', auth });

        const res = await sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEET_ID,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
        });

        log.info(`Stat-backup complete, updated cells: ${res.data.updates?.updatedRange}`, 'SheetsHandler.writeData');
    } catch (err) {
        log.error(err, 'SheetsHandler.writeData');
    }
}

export async function getTokenUrl() {
    try {
        log.info('Getting token url', 'SheetsHandler.getTokenUrl');
        const credentials = await Config.findOne({ key: GOOGLE_CREDENTIALS_KEY }).exec();

        if (!credentials?.value) {
            log.error('Could not find google credentials', 'SheetsHandler.getTokenUrl');
            return;
        }

        log.info('creating Oauth2 client', 'SheetsHandler.getTokenUrl');
        const { client_secret, client_id, redirect_uris } = credentials.value.installed;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        log.info('generating url', 'SheetsHandler.getTokenUrl');
        return oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: GOOGLE_SCOPES,
        });
    } catch (err) {
        log.error(err, 'SheetsHandler.getTokenUrl');
    }
}

export async function setNewToken(code: string) {
    try {
        log.debug('Setting new token', 'SheetsHandler.setNewToken');

        const credentials = await Config.findOne({ key: GOOGLE_CREDENTIALS_KEY }).exec();

        if (!credentials?.value) {
            log.error('Could not find google credentials', 'SheetsHandler.setNewToken');
            return;
        }

        const { client_secret, client_id, redirect_uris } = credentials.value.installed;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        const token = await oAuth2Client.getToken(code);

        log.debug('Token received', 'SheetsHandler.setNewToken');

        // Store token
        await Config.updateOne(
            { key: GOOGLE_TOKENS_KEY },
            { $set: { value: JSON.stringify(token) } },
            { upsert: true }
        ).exec();

        log.debug('New Token successfully stored', 'SheetsHandler.setNewToken');
    } catch (err) {
        log.error(err, 'SheetsHandler.setNewToken');
    }

    return true;
}

export async function backup() {
    try {
        log.debug('Starting backup', 'SheetsHandler.backup');

        const auth = await authorize();

        // BACKUP global stats
        const globalData: (string | number)[] = [];

        const angryReactions = await Stats.findOne({ key: 'angry-reactions' }).exec();
        const tarotsRead = await Stats.findOne({ key: 'tarots-read' }).exec();
        const timesCensored = await Stats.findOne({ key: 'times-censored' }).exec();
        const yesNoQuestions = await Stats.findOne({ key: 'yes-no-questions' }).exec();
        const mcLuhans = await Stats.findOne({ key: 'mc-luhans' }).exec();
        const catgirls = await Stats.findOne({ key: 'catgirls-requested' }).exec();
        const bibleverses = await Stats.findOne({ key: 'bibleverses-requested' }).exec();

        globalData.push(new Date().toLocaleDateString('de-AT'));
        globalData.push(angryReactions?.value ?? 0);
        globalData.push(tarotsRead?.value ?? 0);
        globalData.push(timesCensored?.value ?? 0);
        globalData.push(yesNoQuestions?.value ?? 0);
        globalData.push(mcLuhans?.value ?? 0);
        globalData.push(catgirls?.value ?? 0);
        globalData.push(bibleverses?.value ?? 0);

        writeData(auth, [globalData], 'raw-data!A1');

        log.debug('Backing up tarot data', 'SheetsHandler.backup');

        // BACKUP tarot stats
        const tarotData: (string | number)[] = [];

        const individualTarots = await Stats.findOne({ key: 'individual-tarots-read:any' }).exec();

        if (individualTarots?.anyValue) {
            return; // should never happen
        }

        const tarots = individualTarots?.anyValue as { [key: string]: number };

        tarotData.push(new Date().toLocaleDateString('de-AT'));
        tarotData.push(...Object.values(tarots));

        writeData(auth, [tarotData], 'raw-tarot-data!A1');

        log.debug('Backing up user data', 'SheetsHandler.backup');

        // BACKUP user stats
        const usersData: (string | number)[][] = [];

        const users = await User.find({}).exec();
        const nowString = new Date().toLocaleDateString('de-AT');

        users.forEach(user => {
            const userData: (string | number)[] = [];
            userData.push(nowString);
            userData.push(user.userName);
            userData.push(user.stats['tarots-read']);
            userData.push(user.stats['total-angry-emojis-sent']);
            userData.push(user.stats['times-censored']);
            userData.push(user.stats['yesno-questions']);
            userData.push(user.stats['mc-luhans']);
            userData.push(user.stats['bibleverses-requested']);
            userData.push(user.stats['catgirls-requested']);

            usersData.push(userData);
        });

        writeData(auth, usersData, 'raw-user-data!A1');
    } catch (err) {
        log.error(err, 'SheetsHandler.backup');
    }
}
