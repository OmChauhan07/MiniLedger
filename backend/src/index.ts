// Purpose: Application entry point that starts the HTTP server on the configured port.
// Imported by: none (application entry point)

import { app } from './app.js';
import { config } from './config/env.js';

// Start listening for incoming HTTP connections
const server = app.listen(config.PORT, () => {
  console.log(`MiniLedger API running on port ${config.PORT} [${config.NODE_ENV}]`);
});

// Export server instance for graceful shutdown or integration test control
export default server;
