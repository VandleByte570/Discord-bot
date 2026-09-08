/**
 * @file Main File of the bot, responsible for registering events,
 * commands, interactions etc.
 *
 * @author Naman Vrati
 * @since 1.0.0
 * @version 3.3.0
 */

// Declare constants which will be used throughout the bot.
const fs = require("fs");

const {
	Client,
	Collection,
	GatewayIntentBits,
	Partials,
	Options,
} = require("discord.js");

const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");

// Only token and client ID are required for global commands.
const { token, client_id } = require("./config.json");

/**
 * Main Application Client
 */
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],

	partials: [Partials.Channel],

	makeCache: Options.cacheWithLimits({
		MessageManager: 100,
	}),
});

client.version = "0.4.0";

/**********************************************************************/
/* Event Handler */

// Load event files.
const eventFiles = fs
	.readdirSync("./events")
	.filter((file) => file.endsWith(".js"));

// Register events.
for (const file of eventFiles) {
	const event = require(`./events/${file}`);

	if (event.once) {
		client.once(event.name, (...args) =>
			event.execute(...args, client)
		);
	} else {
		client.on(
			event.name,
			async (...args) => await event.execute(...args, client)
		);
	}
}

/**********************************************************************/
/* Collections */

// Define command and interaction collections.
client.commands = new Collection();
client.slashCommands = new Collection();
client.buttonCommands = new Collection();
client.selectCommands = new Collection();
client.contextCommands = new Collection();
client.modalCommands = new Collection();
client.cooldowns = new Collection();
client.autocompleteInteractions = new Collection();
client.triggers = new Collection();

/**********************************************************************/
/* Legacy Commands */

// Load legacy message commands.
const commandFolders = fs.readdirSync("./commands");

for (const folder of commandFolders) {
	const commandFiles = fs
		.readdirSync(`./commands/${folder}`)
		.filter((file) => file.endsWith(".js"));

	for (const file of commandFiles) {
		const command = require(`./commands/${folder}/${file}`);

		client.commands.set(command.name, command);

		console.log(`Loaded command: ${command.name}`);
	}
}

/**********************************************************************/
/* Slash Commands */

// Load slash commands.
const slashCommands = fs.readdirSync("./interactions/slash");

for (const module of slashCommands) {
	const commandFiles = fs
		.readdirSync(`./interactions/slash/${module}`)
		.filter((file) => file.endsWith(".js"));

	for (const commandFile of commandFiles) {
		const command = require(
			`./interactions/slash/${module}/${commandFile}`
		);

		client.slashCommands.set(command.data.name, command);

		console.log(
			`Loaded slash command: ${command.data.name}`
		);
	}
}

/**********************************************************************/
/* Autocomplete Interactions */

// Load autocomplete interactions.
const autocompleteInteractions = fs.readdirSync(
	"./interactions/autocomplete"
);

for (const module of autocompleteInteractions) {
	const files = fs
		.readdirSync(`./interactions/autocomplete/${module}`)
		.filter((file) => file.endsWith(".js"));

	for (const interactionFile of files) {
		const interaction = require(
			`./interactions/autocomplete/${module}/${interactionFile}`
		);

		client.autocompleteInteractions.set(
			interaction.name,
			interaction
		);
	}
}

/**********************************************************************/
/* Context Menu Interactions */

// Load context-menu interactions.
const contextMenus = fs.readdirSync(
	"./interactions/context-menus"
);

for (const folder of contextMenus) {
	const files = fs
		.readdirSync(`./interactions/context-menus/${folder}`)
		.filter((file) => file.endsWith(".js"));

	for (const file of files) {
		const menu = require(
			`./interactions/context-menus/${folder}/${file}`
		);

		const keyName =
			`${folder.toUpperCase()} ${menu.data.name}`;

		client.contextCommands.set(keyName, menu);
	}
}

/**********************************************************************/
/* Button Interactions */

// Load button interactions.
const buttonCommands = fs.readdirSync(
	"./interactions/buttons"
);

for (const module of buttonCommands) {
	const commandFiles = fs
		.readdirSync(`./interactions/buttons/${module}`)
		.filter((file) => file.endsWith(".js"));

	for (const commandFile of commandFiles) {
		const command = require(
			`./interactions/buttons/${module}/${commandFile}`
		);

		client.buttonCommands.set(command.id, command);
	}
}

/**********************************************************************/
/* Modal Interactions */

// Load modal interactions.
const modalCommands = fs.readdirSync(
	"./interactions/modals"
);

for (const module of modalCommands) {
	const commandFiles = fs
		.readdirSync(`./interactions/modals/${module}`)
		.filter((file) => file.endsWith(".js"));

	for (const commandFile of commandFiles) {
		const command = require(
			`./interactions/modals/${module}/${commandFile}`
		);

		client.modalCommands.set(command.id, command);
	}
}

/**********************************************************************/
/* Select Menu Interactions */

// Load select-menu interactions.
const selectMenus = fs.readdirSync(
	"./interactions/select-menus"
);

for (const module of selectMenus) {
	const commandFiles = fs
		.readdirSync(`./interactions/select-menus/${module}`)
		.filter((file) => file.endsWith(".js"));

	for (const commandFile of commandFiles) {
		const command = require(
			`./interactions/select-menus/${module}/${commandFile}`
		);

		client.selectCommands.set(command.id, command);
	}
}

/**********************************************************************/
/* Register Slash Commands with Discord */

// Discord REST API v10.
const rest = new REST({ version: "10" }).setToken(token);

// Convert commands into Discord API JSON.
const commandJsonData = [
	...Array.from(client.slashCommands.values()).map(
		(command) => command.data.toJSON()
	),

	...Array.from(client.contextCommands.values()).map(
		(command) => command.data
	),
];

/*
 * Register commands globally.
 *
 * IMPORTANT:
 * Global commands can take some time to appear/update in Discord.
 */
(async () => {
	try {
		console.log(
			"Started refreshing application (/) commands..."
		);

		await rest.put(
			Routes.applicationCommands(client_id),
			{
				body: commandJsonData,
			}
		);

		console.log(
			`Successfully registered ${commandJsonData.length} application commands globally.`
		);
	} catch (error) {
		console.error(
			"Failed to register application commands:"
		);

		console.error(error);
	}
})();

/**********************************************************************/
/* Message-Based Chat Triggers */

// Load trigger folders.
const triggerFolders = fs.readdirSync("./triggers");

// Load triggers.
for (const folder of triggerFolders) {
	const triggerFiles = fs
		.readdirSync(`./triggers/${folder}`)
		.filter((file) => file.endsWith(".js"));

	for (const file of triggerFiles) {
		const trigger = require(
			`./triggers/${folder}/${file}`
		);

		client.triggers.set(trigger.name, trigger);
	}
}

/**********************************************************************/
/* Login */

// Login into your Discord application.
client.login(token);
