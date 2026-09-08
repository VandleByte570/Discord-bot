const axios = require("axios");

// ============================================================
// PTERODACTYL CONFIG
// Loaded from Render environment variables
// ============================================================

const PTERODACTYL_DOMAIN =
    process.env.PTERODACTYL_DOMAIN || "";


// ============================================================
// CLIENT API REQUEST
// ============================================================

async function request(endpoint, apiKey, method = "GET", data = null) {

    if (!PTERODACTYL_DOMAIN) {
        throw new Error(
            "PTERODACTYL_DOMAIN environment variable is not set."
        );
    }

    if (!apiKey) {
        throw new Error(
            "Pterodactyl API key is missing."
        );
    }

    const url =
        `${PTERODACTYL_DOMAIN.replace(/\/+$/, "")}/api/client/${endpoint.replace(/^\/+/, "")}`;

    const response = await axios({
        method,
        url,

        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Accept": "Application/vnd.pterodactyl.v1+json",
            "Content-Type": "application/json"
        },

        data
    });

    return response.data;
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    PteroClient: {
        request
    }
};
