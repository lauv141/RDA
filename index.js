require("dotenv").config();
const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require("discord.js");
const http = require("http");

const AUTH_ROLE_ID = "1462012663344271421";
const PREFIX = "rda";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// In-memory storage
const players = {}; // userId -> { clubRoleId, joinedAt, yellow, red }

function isAuthorized(member) {
  return (
    member.permissions.has(PermissionsBitField.Flags.Administrator) ||
    member.roles.cache.has(AUTH_ROLE_ID)
  );
}

function randomColor() {
  const colors = [
    0xff4757, 0x1e90ff, 0x2ed573,
    0xeccc68, 0xff6b81, 0x7bed9f
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

client.once("ready", () => {
  console.log(`RDA Bot online as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  if (!isAuthorized(message.member)) {
    return message.reply("❌ You are not authorized to use RDA commands.");
  }

  // rda register club <name>
  if (command === "register" && args[0] === "club") {
    const name = args.slice(1).join(" ");
    if (!name) return message.reply("❌ Club name required.");

    const role = await message.guild.roles.create({
      name,
      color: randomColor(),
      reason: "RDA club registration"
    });

    return message.reply(`✅ Club registered: **${role.name}**`);
  }

  // rda sign @user @teamrole
  if (command === "sign") {
    const user = message.mentions.members.first();
    const role = message.mentions.roles.first();
    if (!user || !role) return message.reply("❌ Mention user and team role.");

    await user.roles.add(role);

    players[user.id] = {
      clubRoleId: role.id,
      joinedAt: Date.now(),
      yellow: 0,
      red: 0
    };

    return message.reply(`✍️ ${user.user.username} signed for **${role.name}**`);
  }

  // rda release @user
  if (command === "release") {
    const user = message.mentions.members.first();
    if (!user || !players[user.id]) return message.reply("❌ Player not registered.");

    const data = players[user.id];
    const days = (Date.now() - data.joinedAt) / (1000 * 60 * 60 * 24);

    if (days < 2) {
      return message.reply("❌ Player cannot be released before 2 days.");
    }

    const role = message.guild.roles.cache.get(data.clubRoleId);
    if (role) await user.roles.remove(role);

    delete players[user.id];
    return message.reply(`📤 ${user.user.username} released.`);
  }

  // rda yellowcard @user
  if (command === "yellowcard") {
    const user = message.mentions.members.first();
    if (!user) return message.reply("❌ Mention a user.");

    players[user.id] ??= { yellow: 0, red: 0 };
    players[user.id].yellow++;

    return message.reply(`🟨 Yellow card to ${user.user.username}`);
  }

  // rda redcard @user
  if (command === "redcard") {
    const user = message.mentions.members.first();
    if (!user) return message.reply("❌ Mention a user.");

    players[user.id] ??= { yellow: 0, red: 0 };
    players[user.id].red++;

    return message.reply(`🟥 Red card to ${user.user.username}`);
  }

  // rda info @user
  if (command === "info") {
    const user = message.mentions.members.first();
    if (!user || !players[user.id]) return message.reply("❌ No data.");

    const p = players[user.id];
    const days = Math.floor((Date.now() - p.joinedAt) / (1000 * 60 * 60 * 24));
    const club = message.guild.roles.cache.get(p.clubRoleId)?.name || "None";

    const embed = new EmbedBuilder()
      .setTitle(`RDA Info — ${user.user.username}`)
      .addFields(
        { name: "Club", value: club, inline: true },
        { name: "Days", value: `${days}`, inline: true },
        { name: "Yellow Cards", value: `${p.yellow}`, inline: true },
        { name: "Red Cards", value: `${p.red}`, inline: true }
      )
      .setColor(0x2f3542);

    return message.reply({ embeds: [embed] });
  }
});

http.createServer((req, res) => {
  res.end("RDA bot running");
}).listen(process.env.PORT || 3000);

client.login(process.env.TOKEN);
