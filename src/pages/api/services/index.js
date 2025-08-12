import { servicesResponse } from "utils/config/api-response";
import { validateDashboardId } from "utils/config/dashboard-helpers";

export default async function handler(req, res) {
  const { dashboard } = req.query;
  
  if (dashboard && !validateDashboardId(dashboard)) {
    return res.status(400).json({ error: "Invalid dashboard ID" });
  }
  
  res.send(await servicesResponse(dashboard));
}
