import { getDashboards, createDashboard, deleteDashboard } from "utils/config/dashboard-helpers";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const dashboards = getDashboards();
      res.status(200).json({ dashboards });
    } else if (req.method === "POST") {
      const { id, name, description } = req.body;
      
      if (!id || !name) {
        return res.status(400).json({ error: "Dashboard ID and name are required" });
      }

      const dashboard = createDashboard(id, name, description);
      res.status(201).json({ dashboard });
    } else if (req.method === "DELETE") {
      const { id } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: "Dashboard ID is required" });
      }

      deleteDashboard(id);
      res.status(200).json({ message: "Dashboard deleted successfully" });
    } else {
      res.setHeader("Allow", ["GET", "POST", "DELETE"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("Dashboard API error:", error);
    res.status(500).json({ error: error.message });
  }
}