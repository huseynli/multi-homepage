import { createContext, useContext, useEffect, useState, useMemo } from "react";
import useSWR from "swr";

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
  const [activeDashboard, setActiveDashboard] = useState("default");
  const { data: dashboardsData } = useSWR("/api/dashboards");
  
  const dashboards = useMemo(() => {
    return dashboardsData?.dashboards || [
      {
        id: "default",
        name: "Default Dashboard",
        description: "Main dashboard",
        isDefault: true
      }
    ];
  }, [dashboardsData]);

  const currentDashboard = useMemo(() => {
    return dashboards.find(d => d.id === activeDashboard) || dashboards[0];
  }, [dashboards, activeDashboard]);

  // Initialize active dashboard from localStorage or use default
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDashboard = localStorage.getItem("activeDashboard");
      if (savedDashboard && dashboards.some(d => d.id === savedDashboard)) {
        setActiveDashboard(savedDashboard);
      }
    }
  }, [dashboards]);

  // Save active dashboard to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && activeDashboard) {
      localStorage.setItem("activeDashboard", activeDashboard);
    }
  }, [activeDashboard]);

  const switchDashboard = (dashboardId) => {
    if (dashboards.some(d => d.id === dashboardId)) {
      setActiveDashboard(dashboardId);
    }
  };

  const value = {
    activeDashboard,
    currentDashboard,
    dashboards,
    switchDashboard,
    setActiveDashboard
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}