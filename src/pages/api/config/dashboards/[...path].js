import { readFileSync, existsSync } from "fs";
import { join } from "path";

import { CONF_DIR } from "utils/config/config";
import { validateDashboardId } from "utils/config/dashboard-helpers";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { path } = req.query;
    
    if (!path || path.length < 2) {
      return res.status(400).json({ error: "Invalid path" });
    }

    const [dashboardId, configFile] = path;
    
    // Validate dashboard ID
    if (dashboardId !== "default" && !validateDashboardId(dashboardId)) {
      return res.status(400).json({ error: "Invalid dashboard ID" });
    }

    // Validate config file
    if (!configFile || !configFile.endsWith(".yaml")) {
      return res.status(400).json({ error: "Invalid config file" });
    }

    const configType = configFile.replace(".yaml", "");
    if (!["services", "bookmarks", "widgets", "settings"].includes(configType)) {
      return res.status(400).json({ error: "Invalid config type" });
    }

    // Determine file path
    let configPath;
    if (dashboardId === "default") {
      configPath = join(CONF_DIR, configFile);
    } else {
      configPath = join(CONF_DIR, "dashboards", dashboardId, configFile);
    }

    // Check if file exists
    if (!existsSync(configPath)) {
      return res.status(404).json({ error: "Configuration file not found" });
    }

    // Read and return file content
    const content = readFileSync(configPath, "utf8");
    
    res.setHeader("Content-Type", "text/plain");
    res.status(200).send(content);

  } catch (error) {
    console.error("Config read error:", error);
    res.status(500).json({ error: "Failed to read configuration: " + error.message });
  }
}