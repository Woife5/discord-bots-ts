# Discord Bots

## Setup

Make sure you have `bun` installed: [bun.sh](https://bun.sh)

## Angry Bot

The scripts to build an run the bot can be found in `angry-bot/package.json`. Run them with:

    bun run <scriptname>

### Run the bot

Make sure MongoDB is running and the secrets are set up correctly.
Required Secrets:

-   BOT_TOKEN
-   CLIENT_ID
-   MONGO_URI
-   WOLFGANG_ID

For local development a **MongoDB** has to be running locally and its connection string has to be set. It should look something like this:

    mongodb://admin:password@localhost:27017/angryBot?authSource=admin

Where `admin` and `password` are the credentials for the database and `angryBot` is the name of the database.
The `?authSource=admin` part tells mongo to use the `admin` database for authentication.

For local development all the required secrets can be added to a `.env` file which should be in the `./angry-bot` folder next to the `package.json` file for example.

To finally start the development version of the bot run:

    bun run start

This will transpile and run the bot. As soon as any source file changes, bun will automatically restart the bot.
