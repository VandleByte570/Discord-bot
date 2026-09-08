/**
 * @file Main File of the bot
 * @description Registers events, commands and Discord interactions.
 */

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

/*
 * ============================================================
 * ENVIRONMENT VARIABLES
 * ============================================================
 *
 * Render:
 * DISCORD_TOKEN       = Your Discord Bot Token
 * DISCORD_CLIENT_ID  = Your Discord Application ID
 *
 * Do NOT put your bot token directly in this file.
 */

const token = process.env.DISCORD_TOKEN;
const client_id = process.env.DISCORD_CLIENT_ID;

if (!token) {
	console.error("❌ DISCORD_TOKEN environment variable is missing.");
	process.exit(1);
}

if (!client_id) {
	console.error(
		"❌ DISCORD_CLIENT_ID environment variable is missing."
	);
	process.exit(1);
}

/**
 * Main Discord Client
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
/* EVENT HANDLER */

const eventFiles = fs
	.readdirSync("./events")
	.filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
	const event = require(`./events/${file}`);

	if (event.once) {
		client.once(event.name, (...args) =>
			event.execute(...args, client)
		);
	} else {
		client.on(
			event.name,
			async (...args) => {
				try {
					await event.execute(...args, client);
				} catch (error) {
					console.error(
						`❌ Error in event ${event.name}:`
					);
					console.error(error);
				}
			}
		);
	}
}

/**********************************************************************/
/* COLLECTIONS */

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
/* LEGACY COMMANDS */

const commandFolders = fs.readdirSync("./commands");

for (const folder of commandFolders) {
	const commandFiles = fs
		.readdirSync(`./commands/${folder}`)
		.filter((file) => file.endsWith(".js"));

	for (const file of commandFiles) {
		const command = require(
			`./commands/${folder}/${file}`
		);

		client.commands.set(command.name, command);

		console.log(`Loaded command: ${command.name}`);
	}
}

/**********************************************************************/
/* SLASH COMMANDS */

const slashCommands = fs.readdirSync("./interactions/slash");

for (const module of slashCommands) {
	const commandFiles = fs
		.readdirSync(`./interactions/slash/${module}`)
		.filter((file) => file.endsWith(".js"));

	for (const commandFile of commandFiles) {
		const command = require(
			`./interactions/slash/${module}/${commandFile}`
		);

		if (!command.data || !command.data.name) {
			console.warn(
				`⚠️ Invalid slash command: ${module}/${commandFile}`
			);
			continue;
		}

		client.slashCommands.set(
			command.data.name,
			command
		);

		console.log(
			`Loaded slash command: /${command.data.name}`
		);
	}
}

/**********************************************************************/
/* AUTOCOMPLETE */

const autocompleteInteractions = fs.readdirSync(
	"./interactions/autocomplete"
);

for (const module of autocompleteInteractions) {
	const files = fs
		.readdirSync(
			`./interactions/autocomplete/${module}`
		)
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
/* CONTEXT MENUS */

const contextMenus = fs.readdirSync(
	"./interactions/context-menus"
);

for (const folder of contextMenus) {
	const files = fs
		.readdirSync(
			`./interactions/context-menus/${folder}`
		)
		.filter((file) => file.endsWith(".js"));

	for (const file of files) {
		const menu = require(
			`./interactions/context-menus/${folder}/${file}`
		);

		if (!menu.data || !menu.data.name) {
			console.warn(
				`⚠️ Invalid context menu: ${folder}/${file}`
			);
			continue;
		}

		const keyName =
			`${folder.toUpperCase()} ${menu.data.name}`;

		client.contextCommands.set(
			keyName,
			menu
		);
	}
}

/**********************************************************************/
/* BUTTON INTERACTIONS */

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

		client.buttonCommands.set(
			command.id,
			command
		);
	}
}

/**********************************************************************/
/* MODAL INTERACTIONS */

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

		client.modalCommands.set(
			command.id,
			command
		);
	}
}

/**********************************************************************/
/* SELECT MENUS */

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

		client.selectCommands.set(
			command.id,
			command
		);
	}
}

/**********************************************************************/
/* REGISTER DISCORD APPLICATION COMMANDS */

const rest = new REST({
	version: "10",
}).setToken(token);

const commandJsonData = [
	...Array.from(client.slashCommands.values()).map(
		(command) => command.data.toJSON()
	),

	...Array.from(client.contextCommands.values()).map(
		(command) => command.data
	),
];

(async () => {
	try {
		console.log(
			"🔄 Registering Discord application commands..."
		);

		await rest.put(
			Routes.applicationCommands(client_id),
			{
				body: commandJsonData,
			}
		);

		console.log(
			`✅ Successfully registered ${commandJsonData.length} application commands globally.`
		);
	} catch (error) {
		console.error(
			"❌ Failed to register application commands:"
		);
		console.error(error);
	}
})();

/**********************************************************************/
/* MESSAGE TRIGGERS */

const triggerFolders = fs.readdirSync("./triggers");

for (const folder of triggerFolders) {
	const triggerFiles = fs
		.readdirSync(`./triggers/${folder}`)
		.filter((file) => file.endsWith(".js"));

	for (const file of triggerFiles) {
		const trigger = require(
			`./triggers/${folder}/${file}`
		);

		client.triggers.set(
			trigger.name,
			trigger
		);
	}
}

/**********************************************************************/
/* LOGIN */

client.login(token)
	.then(() => {
		console.log("🔐 Login request sent successfully.");
	})
	.catch((error) => {
		console.error("❌ Discord login failed:");
		console.error(error);
		process.exit(1);
	});

process.on("unhandledRejection", (error) => {
	console.error("❌ Unhandled Promise Rejection:");
	console.error(error);
});

process.on("uncaughtException", (error) => {
	console.error("❌ Uncaught Exception:");
	console.error(error);
});
