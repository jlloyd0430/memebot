const { Client, GatewayIntentBits, SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
  new SlashCommandBuilder()
    .setName('lookup')
    .setDescription('Lookup your NFT and apply a filter')
    .addIntegerOption(option => option.setName('nftnumber').setDescription('Your NFT number').setRequired(true))
    .addStringOption(option => option.setName('filter').setDescription('The filter to apply').setRequired(true)
      .addChoices(
        { name: 'GM', value: 'gm' },
        { name: 'Fud Rifle', value: 'gun' },
        { name: 'Nova', value: 'nova' }
      )),
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

client.once('ready', () => {
  console.log('Bot is ready!');
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'lookup') {
    const nftNumber = interaction.options.getInteger('nftnumber');
    const filter = interaction.options.getString('filter');
    const imageUrl = `https://galacticatsmeme.s3.us-east-2.amazonaws.com/${filter}/${nftNumber}.png`;

    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data, 'binary');
      const image = await loadImage(imageBuffer);

      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');

      ctx.drawImage(image, 0, 0, image.width, image.height);

      const buffer = canvas.toBuffer('image/png');
      const attachment = { files: [{ attachment: buffer, name: 'nft.png' }] };

      await interaction.reply(attachment);
    } catch (error) {
      console.error(error);
      await interaction.reply('Failed to fetch or process the image.');
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
