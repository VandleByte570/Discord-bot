/**
 * @file Ready Event File.
 */

const { updateServerStatusEmbeds } = require("../ptero/utils/updateServerStatusEmbeds");
const { updateNodeStatusEmbeds } = require("../ptero/utils/updateNodeStatusEmbeds");
const { updatePresence } = require("../utils/updatePresence");
const { isApplicationKeyValid } = require("../ptero/utils/serverUtils");
const { validatePanelUrl } = require("../ptero/utils/validatePanelUrl");

// Environment-based Pterodactyl configuration
const pterodactyl = {
    domain: process.env.PTERODACTYL_DOMAIN || "",

    NODE_STATUS_UPDATE_INTERVAL:
        Number(process.env.NODE_STATUS_UPDATE_INTERVAL) || 60,

    SERVER_STATUS_UPDATE_INTERVAL:
        Number(process.env.SERVER_STATUS_UPDATE_INTERVAL) || 60
};

module.exports = {
    name: "clientReady",
    once: true,

    async execute(client) {
        try {
            console.log(`🐦 Initiating Ptero-Bot v${client.version}...`);

            // Check Pterodactyl panel URL
            const isPanelUrlValid = await validatePanelUrl();

            if (!isPanelUrlValid) {
                console.error(
                    `❌ The Pterodactyl panel URL (${pterodactyl.domain}) is invalid. ` +
                    `Please check PTERODACTYL_DOMAIN and ensure the panel is online and reachable from the internet.`
                );

                console.log(`🚪 Exiting Ptero-Bot...`);
                process.exit(1);
            }

            // Validate application API key
            const appKeyVaild = await isApplicationKeyValid();

            if (appKeyVaild) {
                console.log(
                    `✅ Successfully authenticated with the Pterodactyl application API for ${pterodactyl.domain}`
                );

                updateNodeStatusEmbeds(
                    client,
                    pterodactyl.NODE_STATUS_UPDATE_INTERVAL
                );
            } else {
                console.warn(
                    "⚠️ The Pterodactyl application API key is invalid. " +
                    "Node status embeds will not be updated. Some other features also may not work..."
                );
            }

            // Update server status embeds
            updateServerStatusEmbeds(
                client,
                pterodactyl.SERVER_STATUS_UPDATE_INTERVAL
            );

            const gitHubUrl = "https://github.com/VolumeZero/ptero-bot";
            console.log(`🔗 Report any issues on: ${gitHubUrl}`);

            console.log(`✅ Ready and logged in as ${client.user.tag}`);

            // Update Discord presence
            updatePresence(client);

            // Update presence every 10 minutes
            setInterval(
                () => updatePresence(client),
                10 * 60 * 1000
            );

        } catch (error) {
            console.error("Error in clientReady event:", error);
        }
    }
};
