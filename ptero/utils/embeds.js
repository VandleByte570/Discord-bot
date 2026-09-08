const { EmbedBuilder } = require("discord.js");

// Read settings from environment variables instead of config.json
const ERROR_LOGGING_ENABLED =
  String(process.env.PTERODACTYL_ERROR_LOGGING_ENABLED || "false").toLowerCase() ===
  "true";

function logError(...args) {
  if (ERROR_LOGGING_ENABLED) {
    console.error(...args);
  }
}

function createServerStatusEmbed(server, status) {
  try {
    const embed = new EmbedBuilder()
      .setTitle(server.name || "Server Status")
      .setTimestamp();

    const normalizedStatus = String(status || "unknown").toLowerCase();

    if (
      normalizedStatus === "running" ||
      normalizedStatus === "online"
    ) {
      embed
        .setDescription("🟢 **Server is Online**")
        .addFields({
          name: "Status",
          value: "Online",
          inline: true,
        });
    } else if (
      normalizedStatus === "offline" ||
      normalizedStatus === "stopped"
    ) {
      embed
        .setDescription("🔴 **Server is Offline**")
        .addFields({
          name: "Status",
          value: "Offline",
          inline: true,
        });
    } else if (
      normalizedStatus === "starting" ||
      normalizedStatus === "stopping"
    ) {
      embed
        .setDescription("🟡 **Server is " + normalizedStatus + "**")
        .addFields({
          name: "Status",
          value: normalizedStatus,
          inline: true,
        });
    } else {
      embed
        .setDescription("⚪ **Server status: " + normalizedStatus + "**")
        .addFields({
          name: "Status",
          value: normalizedStatus,
          inline: true,
        });
    }

    return embed;
  } catch (error) {
    logError("Error creating server status embed:", error);

    return new EmbedBuilder()
      .setTitle("Server Status")
      .setDescription("⚪ Unable to determine server status.")
      .setTimestamp();
  }
}

module.exports = {
  createServerStatusEmbed,
};
