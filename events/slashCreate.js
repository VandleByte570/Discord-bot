/**
 * @file Slash Command Interaction Handler
 *
 * Handles all slash-command interactions safely.
 */

module.exports = {
	name: "interactionCreate",

	/**
	 * Executes when an interaction is created.
	 *
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async execute(interaction) {
		// Ignore anything that isn't a slash command.
		if (!interaction.isChatInputCommand()) return;

		const { client } = interaction;

		// Find the command in the loaded command collection.
		const command = client.slashCommands.get(
			interaction.commandName
		);

		// Command isn't loaded.
		if (!command) {
			console.error(
				`Command not found: /${interaction.commandName}`
			);

			// Make sure Discord gets a response.
			if (!interaction.replied && !interaction.deferred) {
				try {
					await interaction.reply({
						content:
							"This command is currently unavailable.",
						ephemeral: true,
					});
				} catch (error) {
					console.error(
						"Failed to reply for missing command:",
						error
					);
				}
			}

			return;
		}

		try {
			/*
			 * Execute the actual command.
			 *
			 * Commands are responsible for their own reply/deferReply.
			 */
			await command.execute(interaction);
		} catch (error) {
			console.error(
				`Error while executing /${interaction.commandName}:`
			);
			console.error(error);

			/*
			 * Discord interactions can only receive one initial response.
			 *
			 * If the command has already replied:
			 *    use followUp()
			 *
			 * If the command was deferred:
			 *    use editReply()
			 *
			 * Otherwise:
			 *    use reply()
			 */
			try {
				if (interaction.deferred) {
					await interaction.editReply({
						content:
							"❌ Something went wrong while executing this command.",
					});
				} else if (interaction.replied) {
					await interaction.followUp({
						content:
							"❌ Something went wrong while executing this command.",
						ephemeral: true,
					});
				} else {
					await interaction.reply({
						content:
							"❌ Something went wrong while executing this command.",
						ephemeral: true,
					});
				}
			} catch (replyError) {
				console.error(
					"Failed to send interaction error response:"
				);
				console.error(replyError);
			}
		}
	},
};
