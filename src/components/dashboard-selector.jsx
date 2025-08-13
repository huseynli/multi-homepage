import { useState, useRef, useEffect } from "react";
import { useTranslation } from "next-i18next";
import { HiChevronDown, HiViewGrid, HiCog } from "react-icons/hi";
import classNames from "classnames";
import { useDashboard } from "utils/contexts/dashboard";
import { useModal } from "utils/contexts/modal";

export default function DashboardSelector() {
  const { t } = useTranslation();
  const { dashboards, currentDashboard, switchDashboard } = useDashboard();
  const { openModal } = useModal();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (dashboards.length <= 1) {
    return null;
  }

  const handleDashboardSwitch = (dashboardId) => {
    switchDashboard(dashboardId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={classNames(
          "flex items-center space-x-2 px-3 py-2 rounded-md transition-colors duration-200",
          "bg-theme-200/20 hover:bg-theme-300/30 dark:bg-white/5 dark:hover:bg-white/10",
          "text-theme-800 dark:text-theme-200",
          "border border-theme-300/20 dark:border-white/10"
        )}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <HiViewGrid className="w-4 h-4" />
        <span className="text-sm font-medium">{currentDashboard.name}</span>
        <HiChevronDown 
          className={classNames(
            "w-4 h-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {isOpen && (
        <div
          className={classNames(
            "absolute right-0 top-full mt-1 min-w-48 z-50",
            "bg-theme-50 dark:bg-theme-800/95 backdrop-blur-md",
            "border border-theme-300/20 dark:border-white/10",
            "rounded-md shadow-lg"
          )}
        >
          <div className="py-1">
            {dashboards.map((dashboard) => (
              <button
                key={dashboard.id}
                onClick={() => handleDashboardSwitch(dashboard.id)}
                className={classNames(
                  "w-full text-left px-4 py-2 text-sm transition-colors duration-150",
                  "hover:bg-theme-200/30 dark:hover:bg-white/10",
                  dashboard.id === currentDashboard.id
                    ? "bg-theme-300/30 dark:bg-white/10 text-theme-900 dark:text-theme-100 font-medium"
                    : "text-theme-700 dark:text-theme-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{dashboard.name}</div>
                    {dashboard.description && (
                      <div className="text-xs text-theme-500 dark:text-theme-400">
                        {dashboard.description}
                      </div>
                    )}
                  </div>
                  {dashboard.isDefault && (
                    <span className="text-xs px-2 py-1 rounded bg-theme-300/50 dark:bg-white/20 text-theme-600 dark:text-theme-300">
                      Default
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          <div className="border-t border-theme-300/20 dark:border-white/10 pt-1 mt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                openModal('dashboard-management');
              }}
              className={classNames(
                "w-full text-left px-4 py-2 text-sm transition-colors duration-150",
                "hover:bg-theme-200/30 dark:hover:bg-white/10",
                "text-theme-700 dark:text-theme-300 flex items-center"
              )}
            >
              <HiCog className="w-4 h-4 mr-2" />
              Manage Dashboards
            </button>
          </div>
        </div>
      )}
    </div>
  );
}