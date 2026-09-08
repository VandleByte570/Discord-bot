const axios = require("axios");

// ============================================================
// PTERODACTYL / WINGS CONFIG
// Loaded from Render environment variables
// ============================================================

const pterodactyl = {
    LOG_HTTP_WARNINGS:
        String(
            process.env.LOG_HTTP_WARNINGS || "false"
        ).toLowerCase() === "true",

    ERROR_LOGGING_ENABLED:
        String(
            process.env.PTERODACTYL_ERROR_LOGGING_ENABLED || "false"
        ).toLowerCase() === "true",

    WINGS_API_TIMEOUT:
        Number(
            process.env.WINGS_API_TIMEOUT
        ) || 2500
};


// ============================================================
// WINGS API
// ============================================================

const PteroWings = {

    async request(
        apiEndpoint,
        nodeDetails,
        nodeToken,
        method = "get",
        data = null
    ) {

        try {

            if (
                nodeDetails.scheme !== "https" &&
                pterodactyl.LOG_HTTP_WARNINGS
            ) {

                console.warn(
                    `⚠️ Warning: You are making a Wings API request to node ${nodeDetails.name} over an unsecure HTTP connection. This is not recommended for production environments.\n` +
                    `(If you are running the node on the same machine or network as the panel, you may ignore this warning and disable LOG_HTTP_WARNINGS in the environment variables.)`
                );
            }


            const url =
                `${nodeDetails.scheme}://${nodeDetails.fqdn}:${nodeDetails.daemon_listen}/api/${apiEndpoint}`;


            const headers = {
                "Authorization": `Bearer ${nodeToken}`,
                "Accept": "Application/vnd.pterodactyl.v1+json",
                "Content-Type": "application/json"
            };


            const options = {
                method,
                url,
                headers,
                data,
                timeout: pterodactyl.WINGS_API_TIMEOUT
            };


            const response = await axios(options);

            return response.data;

        } catch (error) {

            if (pterodactyl.ERROR_LOGGING_ENABLED) {

                console.error(
                    `Error making Wings API request to ${apiEndpoint} on node ${nodeDetails?.name || "unknown"}:`,
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
            "An unknown error occurred while making a Wings API request.";


        switch (true) {

            case error.response &&
                error.response.status === 400:

                message =
                    "Bad Request: The server could not understand the request due to invalid syntax.";

                break;


            case error.response &&
                error.response.status === 401:

                message =
                    "Unauthorized: Your node token is invalid. Please check your Node Token in the Pterodactyl panel.";

                break;


            case error.response &&
                error.response.status === 403:

                message =
                    "Forbidden: Your node token does not have permission to access this resource. Please check the permissions for your Node Token in the Pterodactyl admin panel.";

                break;


            case error.response &&
                error.response.status === 404:

                message =
                    "Not Found: The requested resource was not found.";

                break;


            case error.response &&
                error.response.status === 500:

                message =
                    "Internal Server Error: The server has encountered a situation it doesn't know how to handle.";

                break;


            case error.response &&
                error.response.status === 502:

                message =
                    "Bad Gateway: The server was acting as a gateway or proxy and received an invalid response from the upstream server.";

                break;


            case error.response &&
                error.response.status === 503:

                message =
                    "Service Unavailable: The server is not ready to handle the request.";

                break;


            case error.response &&
                error.response.status === 504:

                message =
                    "Gateway Timeout: The server was acting as a gateway or proxy and did not receive a timely response from the upstream server. The Pterodactyl panel or Wings node may be down or unreachable.";

                break;


            case error.code === "ECONNREFUSED":

                message =
                    "Connection Refused: Unable to connect to the Wings node. Please ensure the node is online and reachable.";

                break;


            case error.code === "ETIMEDOUT":

                message =
                    "Connection Timed Out: The request to the Wings node timed out or the node is offline. Please check the network connection and try again.";

                break;


            default:

                message =
                    `Unexpected Error: ${error.message} while communicating with the Wings node API endpoint.`;

                break;
        }


        return message;
    }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    PteroWings
};
