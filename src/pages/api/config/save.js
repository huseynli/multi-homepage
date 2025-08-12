import { writeFileSync } from "fs";
import { join } from "path";

import yaml from "js-yaml";

import { CONF_DIR } from "utils/config/config";
import { getDashboardConfigPath, validateDashboardId } from "utils/config/dashboard-helpers";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { dashboardId, configType, content } = req.body;

    // Validate inputs
    if (!dashboardId || !configType || content === undefined) {
      return res.status(400).json({ error: "Missing required fields: dashboardId, configType, content" });
    }

    if (!["services", "bookmarks", "widgets", "settings"].includes(configType)) {
      return res.status(400).json({ error: "Invalid config type. Must be one of: services, bookmarks, widgets, settings" });
    }

    if (dashboardId !== "default" && !validateDashboardId(dashboardId)) {
      return res.status(400).json({ error: "Invalid dashboard ID" });
    }

    // Validate YAML syntax
    try {
      yaml.load(content);
    } catch (yamlError) {
      return res.status(400).json({ error: `Invalid YAML syntax: ${yamlError.message}` });
    }

    // Determine file path
    const configPath = getDashboardConfigPath(dashboardId, `${configType}.yaml`);

    // Write the configuration file
    writeFileSync(configPath, content, "utf8");

    res.status(200).json({ 
      message: "Configuration saved successfully",
      dashboardId,
      configType,
      path: configPath
    });

  } catch (error) {
    console.error("Config save error:", error);
    res.status(500).json({ error: "Failed to save configuration: " + error.message });
  }
}