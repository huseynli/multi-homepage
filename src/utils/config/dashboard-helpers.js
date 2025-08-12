import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, copyFileSync } from "fs";
import { join } from "path";

import yaml from "js-yaml";

import { CONF_DIR, substituteEnvironmentVars } from "./config";

export const DASHBOARDS_DIR = join(CONF_DIR, "dashboards");
export const DASHBOARDS_CONFIG = join(CONF_DIR, "dashboards.yaml");

export function ensureDashboardsDirectory() {
  if (!existsSync(DASHBOARDS_DIR)) {
    try {
      mkdirSync(DASHBOARDS_DIR, { recursive: true });
    } catch (e) {
      console.warn(`Could not create dashboards directory ${DASHBOARDS_DIR}: ${e.message}`);
      return false;
    }
  }
  return true;
}

export function getDashboardConfigPath(dashboardId, configFile) {
  if (dashboardId === "default" || !dashboardId) {
    return join(CONF_DIR, configFile);
  }
  return join(DASHBOARDS_DIR, dashboardId, configFile);
}

export function getDashboards() {
  // Initialize dashboards.yaml if it doesn't exist
  if (!existsSync(DASHBOARDS_CONFIG)) {
    const defaultDashboards = {
      dashboards: [
        {
          id: "default",
          name: "Default Dashboard",
          description: "Main dashboard",
          isDefault: true
        }
      ]
    };
    writeFileSync(DASHBOARDS_CONFIG, yaml.dump(defaultDashboards));
  }

  try {
    const rawFileContents = readFileSync(DASHBOARDS_CONFIG, "utf8");
    const fileContents = substituteEnvironmentVars(rawFileContents);
    const config = yaml.load(fileContents);
    return config?.dashboards || [];
  } catch (e) {
    console.error("Failed to load dashboards.yaml:", e.message);
    return [
      {
        id: "default",
        name: "Default Dashboard",
        description: "Main dashboard",
        isDefault: true
      }
    ];
  }
}

export function createDashboard(id, name, description = "") {
  if (!id || !name) {
    throw new Error("Dashboard ID and name are required");
  }

  ensureDashboardsDirectory();
  
  const dashboardDir = join(DASHBOARDS_DIR, id);
  
  if (existsSync(dashboardDir)) {
    throw new Error(`Dashboard with ID "${id}" already exists`);
  }

  try {
    mkdirSync(dashboardDir, { recursive: true });
    
    // Copy skeleton files to new dashboard directory
    const skeletonDir = join(process.cwd(), "src", "skeleton");
    const configFiles = ["bookmarks.yaml", "services.yaml", "widgets.yaml", "settings.yaml"];
    
    configFiles.forEach(file => {
      const sourcePath = join(skeletonDir, file);
      const destPath = join(dashboardDir, file);
      if (existsSync(sourcePath)) {
        copyFileSync(sourcePath, destPath);
      }
    });

    // Update dashboards.yaml
    const dashboards = getDashboards();
    dashboards.push({
      id,
      name,
      description,
      isDefault: false,
      createdAt: new Date().toISOString()
    });

    writeFileSync(DASHBOARDS_CONFIG, yaml.dump({ dashboards }));
    
    return { id, name, description };
  } catch (e) {
    throw new Error(`Failed to create dashboard: ${e.message}`);
  }
}

export function deleteDashboard(id) {
  if (id === "default") {
    throw new Error("Cannot delete the default dashboard");
  }

  const dashboardDir = join(DASHBOARDS_DIR, id);
  if (!existsSync(dashboardDir)) {
    throw new Error(`Dashboard with ID "${id}" does not exist`);
  }

  try {
    // Remove dashboard directory and contents
    const fs = require("fs");
    fs.rmSync(dashboardDir, { recursive: true, force: true });

    // Update dashboards.yaml
    const dashboards = getDashboards();
    const filteredDashboards = dashboards.filter(d => d.id !== id);
    writeFileSync(DASHBOARDS_CONFIG, yaml.dump({ dashboards: filteredDashboards }));
    
    return true;
  } catch (e) {
    throw new Error(`Failed to delete dashboard: ${e.message}`);
  }
}

export function validateDashboardId(id) {
  if (!id) return false;
  if (id === "default") return true;
  
  const dashboards = getDashboards();
  return dashboards.some(d => d.id === id);
}