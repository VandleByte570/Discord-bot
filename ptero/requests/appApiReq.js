const axios = require("axios");

// ============================================================
// PTERODACTYL CONFIG
// Loaded from Render environment variables
// ============================================================

const pterodactyl = {
    domain: process.env.PTERODACTYL_DOMAIN || "",
    apiKey: process.env.PTERODACTYL_API_KEY || "",

    ERROR_LOGGING_ENABLED:
        String(
            process.env.PTERODACTYL_ERROR_LOGGING_ENABLED || "false"
        ).toLowerCase() === "true"
};


// ============================================================
// PTERODACTYL APPLICATION API
// ============================================================

const PteroApp = {

    async request(apiEndpoint, method = "get", data = null) {

        try {

            if (!pterodactyl.domain) {
                throw new Error(
                    "PTERODACTYL_DOMAIN environment variable is not set."
                );
            }

            if (!pterodactyl.apiKey) {
                throw new Error(
                    "PTERODACTYL_API_KEY environment variable is not set."
                );
            }

            const cleanDomain =
                pterodactyl.domain.replace(/\/+$/, "");

            const cleanEndpoint =
                String(apiEndpoint).replace(/^\/+/, "");

            const url =
                `${cleanDomain}/api/application/${cleanEndpoint}`;

            const headers = {
                "Authorization": `Bearer ${pterodactyl.apiKey}`,
                "Accept": "Application/vnd.pterodactyl.v1+json",
                "Content-Type": "application/json"
            };

            const options = {
                method,
                url,
                headers,
                data
            };

            const response = await axios(options);

            return response.data;

        } catch (error) {

            if (pterodactyl.ERROR_LOGGING_ENABLED) {
                console.error(
                    `Error making Pterodactyl API request to application/${apiEndpoint}:`,
                    error
                );
            }

            throw error;
        }
    },


    // ========================================================
    // ERROR MESSAGE
    // ========================================================

    getErrorMessage(error) {

        let message =
            "An unknown error occurred while making an application API request.";

        switch (true) {

            case error.response &&
                error.response.status === 400:

                message =
                    "Bad Request: The server could not understand the request due to invalid syntax.";

                break;


            case error.response &&
                error.response.status === 401:

                message =
                    "Unauthorized: Your Pterodactyl Application API key is invalid. Please check your PTERODACTYL_API_KEY.";

                break;


            case error.response &&
                error.response.status === 403:

                message =
                    "Forbidden: Your Pterodactyl Application API key does not have permission to access this resource. Please check its permissions in the Pterodactyl admin panel.";

                break;


            case error.response &&
                error.response.status === 404:

                message =
                    "Not Found: The requested resource was not found.";

                break;


            case error.response &&
                error.response.status === 500:

                message =
                    "Internal Server Error: The Pterodactyl server encountered an unexpected error.";

                break;


            case error.response &&
                error.response.status === 502:

                message =
                    "Bad Gateway: The server was acting as a gateway or proxy and received an invalid response from the upstream server.";

                break;


            case error.response &&
                error.response.status === 503:

                message =
                    "Service Unavailable: The Pterodactyl server is not ready to handle the request.";

                break;


            case error.response &&
                error.response.status === 504:

                message =
                    "Gateway Timeout: The Pterodactyl panel did not respond in time. The panel may be offline or unreachable.";

                break;


            case error.code === "ECONNREFUSED":

                message =
                    "Connection Refused: Unable to connect to the Pterodactyl panel. Please ensure the panel is online and reachable.";

                break;


            case error.code === "ETIMEDOUT":

                message =
                    "Connection Timed Out: The request to the Pterodactyl panel timed out or the panel is offline. Please check the network connection and try again.";

                break;
        }

        return message;
    }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    PteroApp
};
