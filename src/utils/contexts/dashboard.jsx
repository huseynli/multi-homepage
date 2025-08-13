import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
  const router = useRouter();
  const [activeDashboard, setActiveDashboard] = useState("default");
  const [isInitialized, setIsInitialized] = useState(false);
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

  // Initialize dashboard from URL, then localStorage, then default
  useEffect(() => {
    if (!router.isReady || isInitialized) return;
    
    // Don't initialize until we have real dashboard data (not just the fallback)
    if (!dashboardsData?.dashboards) return;

    const urlDashboard = router.query.dashboard;
    let targetDashboard = "default";

    if (urlDashboard && dashboards.some(d => d.id === urlDashboard)) {
      // Use dashboard from URL if valid
      targetDashboard = urlDashboard;
    } else if (typeof window !== "undefined") {
      // Fallback to localStorage if no valid URL parameter
      const savedDashboard = localStorage.getItem("activeDashboard");
      if (savedDashboard && dashboards.some(d => d.id === savedDashboard)) {
        targetDashboard = savedDashboard;
      }
    }

    setActiveDashboard(targetDashboard);
    setIsInitialized(true);

    // Update URL if it doesn't match the target dashboard
    if (targetDashboard !== "default" && !urlDashboard) {
      router.replace({ pathname: router.pathname, query: { dashboard: targetDashboard } }, undefined, { shallow: true });
    }
  }, [router.isReady, router.query.dashboard, dashboards, dashboardsData, isInitialized, router]);

  // Save active dashboard to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && activeDashboard && isInitialized) {
      localStorage.setItem("activeDashboard", activeDashboard);
    }
  }, [activeDashboard, isInitialized]);

  const switchDashboard = (dashboardId) => {
    if (dashboards.some(d => d.id === dashboardId)) {
      setActiveDashboard(dashboardId);
      
      // Update URL
      const newQuery = dashboardId === "default" ? {} : { dashboard: dashboardId };
      router.push({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true });
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