require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const http = require("http");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.once("ready", () => {
  console.log(`RDA Bot online as ${client.user.tag}`);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  if (message.content === "!ping") {
    message.reply("⚽ RDA is live.");
  }
});

http.createServer((req, res) => {
  res.end("RDA bot running");
}).listen(process.env.PORT || 3000);

client.login(process.env.TOKEN);
