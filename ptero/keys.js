const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

/*
 * Pterodactyl encryption key.
 *
 * Render:
 * PTERODACTYL_ENCRYPTION_KEY = your encryption key
 */
const ENCRYPTION_KEY =
	process.env.PTERODACTYL_ENCRYPTION_KEY || "dev-key";

const DATA_FILE = path.resolve("./apikeys.json");

const IV_LENGTH = 16;

/*
 * Always derive a valid 32-byte AES key.
 */
const KEY = crypto
	.createHash("sha256")
	.update(String(ENCRYPTION_KEY))
	.digest();

function encrypt(text) {
	const iv = crypto.randomBytes(IV_LENGTH);

	const cipher = crypto.createCipheriv(
		"aes-256-cbc",
		KEY,
		iv
	);

	let encrypted = cipher.update(
		String(text),
		"utf8",
		"hex"
	);

	encrypted += cipher.final("hex");

	return `${iv.toString("hex")}:${encrypted}`;
}

function decrypt(text) {
	const [ivHex, encryptedData] = String(text).split(":");

	if (!ivHex || !encryptedData) {
		throw new Error("Invalid encrypted API key format.");
	}

	const iv = Buffer.from(ivHex, "hex");

	const decipher = crypto.createDecipheriv(
		"aes-256-cbc",
		KEY,
		iv
	);

	let decrypted = decipher.update(
		encryptedData,
		"hex",
		"utf8"
	);

	decrypted += decipher.final("utf8");

	return decrypted;
}

async function saveApiKey(userId, apiKey) {
	let data = {};

	try {
		data = JSON.parse(
			await fs.readFile(DATA_FILE, "utf8")
		);
	} catch (error) {
		if (error.code !== "ENOENT") {
			throw error;
		}
	}

	data[userId] = encrypt(apiKey);

	await fs.writeFile(
		DATA_FILE,
		JSON.stringify(data, null, 2)
	);

	console.log(`Saved API key for user ${userId}`);
}

async function loadApiKey(userId) {
	try {
		const data = JSON.parse(
			await fs.readFile(DATA_FILE, "utf8")
		);

		return data[userId]
			? decrypt(data[userId])
			: null;
	} catch (error) {
		return null;
	}
}

module.exports = {
	saveApiKey,
	loadApiKey,
};
