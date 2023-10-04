# Discord Bots

## Setup

Make sure you have `pnpm` installed:

    npm install -g pnpm

## Angry Bot

The scripts to build an run the bot can be found in `angry-bot/package.json`. Run them with:

    pnpm <scriptname>

### Run the bot

Make sure MongoDB is running and the secrets are set up correctly.
Required Secrets:

-   ANGRY1_TOKEN
-   CLIENT_ID
-   MONGO_URI
-   WOLFGANG_ID

For local development a **MongoDB** has to be running locally and its connection string has to be set. It should look something like this:
    
    mongodb://admin:password@localhost:27017/angryBot?authSource=admin
    
Where `admin` and `password` are the credentials for the database and `angryBot` is the name of the database.
The `?authSource=admin` part tells mongo to use the `admin` database for authentication.

For local development all the required secrets can be added to a `.env` file which should be in the `./angry-bot` folder next to the `package.json` file for example.

To finally start the development version of the bot run:

    pnpm start

This will transpile and run the bot with `node`.
Version 18 of `node` is used in production so it would be wise to also use it for development although it may also work with other version.
If any files change you have to stop the running process using `Ctrl+C` and run `pnpm start` again.
Otherwise the changes will not be applied.
