/**
 * @file Slash Command Interaction Handler
 */

module.exports = {
	name: "interactionCreate",

	async execute(interaction) {
		// This handler only handles slash commands.
		if (!interaction.isChatInputCommand()) {
			return;
		}

		const { client } = interaction;

		const command = client.slashCommands.get(
			interaction.commandName
		);

		/*
		 * Command doesn't exist in our collection.
		 */
		if (!command) {
			console.error(
				`❌ Command not found: /${interaction.commandName}`
			);

			try {
				if (
					!interaction.replied &&
					!interaction.deferred
				) {
					await interaction.reply({
						content:
							"❌ This command is currently unavailable.",
						ephemeral: true,
					});
				}
			} catch (error) {
				console.error(
					"❌ Failed to respond to missing command:"
				);
				console.error(error);
			}

			return;
		}

		try {
			/*
			 * Run the actual slash command.
			 *
			 * Each command is responsible for calling:
			 * interaction.reply()
			 * OR
			 * interaction.deferReply()
			 */
			await command.execute(interaction);
		} catch (error) {
			console.error(
				`❌ Error executing /${interaction.commandName}:`
			);
			console.error(error);

			/*
			 * Never attempt a second initial reply.
			 */
			try {
				if (interaction.deferred) {
					await interaction.editReply({
						content:
							"❌ An error occurred while executing this command.",
					});
				} else if (interaction.replied) {
					await interaction.followUp({
						content:
							"❌ An error occurred while executing this command.",
						ephemeral: true,
					});
				} else {
					await interaction.reply({
						content:
							"❌ An error occurred while executing this command.",
						ephemeral: true,
					});
				}
			} catch (responseError) {
				console.error(
					"❌ Could not send command error response:"
				);
				console.error(responseError);
			}
		}
	},
};
