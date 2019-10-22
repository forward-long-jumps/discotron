const Logger = require("./utils/logger.js");
Logger.setSeverity("info");

const DiscordJS = require("discord.js");
const parseArgs = require("minimist");

global.discotronConfigPath = __dirname + "/../instance";
handleArgs(parseArgs(process.argv));

let appConfig;
loadConfig();

    const databaseHelper = require("./utils/database-helper.js");
// Database
if (!databaseHelper.databaseExists()) {
    databaseHelper.createDatabase();
}

databaseHelper.openDatabase();

const webserver = require("./webserver.js");
const discotron = require("./discotron.js");

const discordClient = new DiscordJS.Client();

global.discotron = discotron;
global.discordClient = discordClient;

discotron.loadOwners();

discotron.loadGuilds().then(() => {
    discotron.loadRepositories();

    // Web server
    webserver.startAPIServer();
    webserver.serveDashboard();

    connectToDiscord();

    registerEvents();
    discotron.registerActions();
}).catch(Logger.err);

/**
 * Attempts to connect the bot client to Discord
 * @returns {Promise} resolve(), reject()
 */
function connectToDiscord() {
    return new Promise((resolve, reject) => {
        Logger.log("Connecting to discord...");
        discordClient.login(appConfig.token).then(() => {
            resolve();
        }).catch((err) => {
            Logger.log("Could not connect to discord", "err");
            Logger.log(err.message, "err");
        });
    });
}

global.discordClient._connectToDiscord = connectToDiscord;

/**
 * Register Discord events and associate them to Discotron handlers
 */
function registerEvents() {
    // TODO: Handle error and reaction

    discordClient.on("ready", () => {
        Logger.log("Logged into Discord as **" + discordClient.user.tag + "**", "info");
        discotron.updateGuilds();
        discotron.getBotSettings().setBotPresence();
    });

    discordClient.on("message", discotron.onMessage);
    discordClient.on("messageReactionAdd", discotron.onReaction);
    discordClient.on("guildCreate", discotron.onJoinGuild);
    discordClient.on("guildDelete", discotron.onLeaveGuild);
    discordClient.on("error", () => {
        // TODO: Handle reconnection and bot status update
    });

    // Handle disconnecting the bot gracefully
    process.stdin.resume();

    process.on("exit", exitHandler.bind(null, {
        cleanup: true
    }));
    process.on("SIGINT", exitHandler.bind(null, {
        exit: true
    }));
    process.on("SIGUSR1", exitHandler.bind(null, {
        exit: true
    }));
    process.on("SIGUSR2", exitHandler.bind(null, {
        exit: true
    }));
}

/**
 * Handle command-line arguments passed to the executable.
 * @param {object} args Parsed arguments as an object. 
 */
function handleArgs(args) {
    // Path where all configs are stored
    const cfgPath = args["config-path"] || args.c;
    if (cfgPath) {
        global.discotronConfigPath = cfgPath;
        if (cfgPath[cfgPath.length - 1] === "/") {
            global.discotronConfigPath = cfgPath.substr(0, cfgPath.length - 1);
        }
    }
}

/**
 * Attempts to load the config from disk, checks for missing files
 */
function loadConfig() {
    try {
        appConfig = require(global.discotronConfigPath + "/bot.json");
        if (typeof appConfig.token === "undefined" || appConfig.token === "") {
            Logger.log("Missing **token** in **bot.json**.", "err");
            process.exit();
        }
        if (typeof appConfig.applicationId === "undefined" || appConfig.applicationId === "") {
            Logger.log("Missing **applicationId** in **bot.json**.", "err");
            process.exit();
        }
        if (typeof appConfig.oauth2Secret === "undefined" || appConfig.oauth2Secret === "") {
            Logger.log("Missing **oauth2Secret** in **bot.json**.", "err");
            process.exit();
        }
        if (typeof appConfig.redirectURI === "undefined" || appConfig.redirectURI === "") {
            Logger.log("Missing **redirectURI** in **bot.json**.", "err");
            process.exit();
        }
    } catch (err) {
        Logger.log("Please run **npm install** and set up the application config.", "err");
        process.exit();
        return;
    }

}


// Source: https://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits
/**
 * Called when the application is about to be closed
 * @param {object} options Set options.exit to true to leave
 */
function exitHandler(options) {
    global.discordClient.destroy().then(() => {
        if (options.exit) {
            process.exit();
        }
    }).catch(Logger.err);
}
