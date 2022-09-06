# Discord Bots

## Setup

Make sure you have `yarn` installed:

    npm install -g yarn

## Angry Bot

The scripts to build an run the bot can be found in `angry-bot/package.json`. Run them with:

    yarn <scriptname>

### Run the bot

Make sure MongoDB is running and the secrets are set correctly
Required Secrets:

-   ANGRY1_TOKEN
-   CLIENT_ID
-   ANGRY_REACTIONS
-   MONGO_URI
-   WOLFGANG_ID
-   _DEPRECATED_ GOOGLE_SHEET_ID

1. Copy `package.json` and `yarn.lock` to a new directory, also copy the `build` folder there.
2. Copy the `Dockerfile` from `angry-bot` to the new directory.
3. Optionally create your own `docker-compose.yml` file with your setup and secrets.
4. Run the container

## Angrier Bot

TBD
