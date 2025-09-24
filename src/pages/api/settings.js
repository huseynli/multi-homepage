import { getSettings } from "utils/config/config";
import { validateDashboardId } from "utils/config/dashboard-helpers";

export default async function handler(req, res) {
  const { dashboard } = req.query;
  
  if (dashboard && !validateDashboardId(dashboard)) {
    return res.status(400).json({ error: "Invalid dashboard ID" });
  }
  
  try {
    const settings = getSettings(dashboard);
    res.json(settings);
  } catch (error) {
    console.error("Settings API error:", error);
    res.status(500).json({ error: "Failed to load settings: " + error.message });
  }
}