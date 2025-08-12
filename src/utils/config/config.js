/* eslint-disable no-console */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";

import yaml from "js-yaml";
import cache from "memory-cache";

const cacheKey = "homepageEnvironmentVariables";
const homepageVarPrefix = "HOMEPAGE_VAR_";
const homepageFilePrefix = "HOMEPAGE_FILE_";

export const CONF_DIR = process.env.HOMEPAGE_CONFIG_DIR
  ? process.env.HOMEPAGE_CONFIG_DIR
  : join(process.cwd(), "config");

export default function checkAndCopyConfig(config, dashboardId = null) {
  const configDir = dashboardId && dashboardId !== "default" 
    ? join(CONF_DIR, "dashboards", dashboardId)
    : CONF_DIR;

  // Ensure config directory exists
  if (!existsSync(configDir)) {
    try {
      mkdirSync(configDir, { recursive: true });
    } catch (e) {
      console.warn(`Could not create config directory ${configDir}: ${e.message}`);
      return false;
    }
  }

  const configYaml = join(configDir, config);

  // If the config file doesn't exist, try to copy the skeleton
  if (!existsSync(configYaml)) {
    const configSkeleton = join(process.cwd(), "src", "skeleton", config);
    try {
      copyFileSync(configSkeleton, configYaml);
      console.info("%s was copied to the config folder", config);
    } catch (err) {
      console.error("❌ Failed to initialize required config: %s", configYaml);
      console.error("Reason: %s", err.message);
      console.error("Hint: Make config directory writable or manually place the config file.");
      process.exit(1);
    }

    return true;
  }

  try {
    yaml.load(readFileSync(configYaml, "utf8"));
    return true;
  } catch (e) {
    return { ...e, config };
  }
}

function getCachedEnvironmentVars() {
  let cachedVars = cache.get(cacheKey);
  if (!cachedVars) {
    // initialize cache
    cachedVars = Object.entries(process.env).filter(
      ([key]) => key.includes(homepageVarPrefix) || key.includes(homepageFilePrefix),
    );
    cache.put(cacheKey, cachedVars);
  }
  return cachedVars;
}

export function substituteEnvironmentVars(str) {
  let result = str;
  if (result.includes("{{")) {
    // crude check if we have vars to replace
    const cachedVars = getCachedEnvironmentVars();
    cachedVars.forEach(([key, value]) => {
      if (key.startsWith(homepageVarPrefix)) {
        result = result.replaceAll(`{{${key}}}`, value);
      } else if (key.startsWith(homepageFilePrefix)) {
        const filename = value;
        const fileContents = readFileSync(filename, "utf8");
        result = result.replaceAll(`{{${key}}}`, fileContents);
      }
    });
  }
  return result;
}

export function getSettings(dashboardId = null) {
  checkAndCopyConfig("settings.yaml", dashboardId);

  const configDir = dashboardId && dashboardId !== "default" 
    ? join(CONF_DIR, "dashboards", dashboardId)
    : CONF_DIR;
  const settingsYaml = join(configDir, "settings.yaml");
  
  const rawFileContents = readFileSync(settingsYaml, "utf8");
  const fileContents = substituteEnvironmentVars(rawFileContents);
  const initialSettings = yaml.load(fileContents) ?? {};

  if (initialSettings.layout) {
    // support yaml list but old spec was object so convert to that
    // see https://github.com/gethomepage/homepage/issues/1546
    if (Array.isArray(initialSettings.layout)) {
      const layoutItems = initialSettings.layout;
      initialSettings.layout = {};
      layoutItems.forEach((i) => {
        const name = Object.keys(i)[0];
        initialSettings.layout[name] = i[name];
      });
    }
  }
  return initialSettings;
}
