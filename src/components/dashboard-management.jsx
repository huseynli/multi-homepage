import { useState, useRef, useEffect } from "react";
import { useTranslation } from "next-i18next";
import { 
  HiX, 
  HiPlus, 
  HiPencil, 
  HiTrash, 
  HiDuplicate,
  HiDownload,
  HiUpload,
  HiExclamation,
  HiCog
} from "react-icons/hi";
import classNames from "classnames";
import { useDashboard } from "utils/contexts/dashboard";
import { mutate } from "swr";

import ConfigEditor from "./config-editor";

export default function DashboardManagement({ isOpen, onClose }) {
  const { t } = useTranslation();
  const { dashboards, switchDashboard, currentDashboard } = useDashboard();
  const [isCreating, setIsCreating] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState(null);
  const [deletingDashboard, setDeletingDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [configEditor, setConfigEditor] = useState({ isOpen: false, dashboardId: null, configType: null });
  const modalRef = useRef(null);

  // Form states
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: ""
  });

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const resetForm = () => {
    setFormData({ id: "", name: "", description: "" });
    setIsCreating(false);
    setEditingDashboard(null);
    setError("");
  };

  const validateForm = () => {
    if (!formData.id.trim()) {
      setError("Dashboard ID is required");
      return false;
    }
    if (!formData.name.trim()) {
      setError("Dashboard name is required");
      return false;
    }
    if (!/^[a-z0-9-_]+$/.test(formData.id)) {
      setError("Dashboard ID can only contain lowercase letters, numbers, hyphens, and underscores");
      return false;
    }
    if (!editingDashboard && dashboards.some(d => d.id === formData.id)) {
      setError("Dashboard ID already exists");
      return false;
    }
    return true;
  };

  const handleCreateDashboard = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/dashboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create dashboard");
      }

      // Refresh dashboards list
      await mutate("/api/dashboards");
      resetForm();
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDashboard = async (dashboardId) => {
    if (dashboardId === "default") {
      setError("Cannot delete the default dashboard");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/dashboards", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: dashboardId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete dashboard");
      }

      // Switch to default if deleting current dashboard
      if (currentDashboard.id === dashboardId) {
        switchDashboard("default");
      }

      // Refresh dashboards list
      await mutate("/api/dashboards");
      setDeletingDashboard(null);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportDashboard = async (dashboardId) => {
    try {
      const [servicesRes, bookmarksRes, widgetsRes] = await Promise.all([
        fetch(`/api/services?dashboard=${dashboardId}`),
        fetch(`/api/bookmarks?dashboard=${dashboardId}`),
        fetch(`/api/widgets?dashboard=${dashboardId}`)
      ]);

      const [services, bookmarks, widgets] = await Promise.all([
        servicesRes.json(),
        bookmarksRes.json(),
        widgetsRes.json()
      ]);

      const dashboard = dashboards.find(d => d.id === dashboardId);
      const exportData = {
        dashboard: {
          name: dashboard.name,
          description: dashboard.description
        },
        services,
        bookmarks,
        widgets,
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dashboard-${dashboardId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to export dashboard: " + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" />

        <div
          ref={modalRef}
          className={classNames(
            "inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform",
            "bg-theme-50 dark:bg-theme-800 rounded-lg shadow-xl"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-theme-200 dark:border-theme-700">
            <h3 className="text-lg font-medium text-theme-900 dark:text-theme-100">
              Dashboard Management
            </h3>
            <button
              onClick={onClose}
              className="text-theme-400 hover:text-theme-600 dark:text-theme-500 dark:hover:text-theme-300"
            >
              <HiX className="w-6 h-6" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 mx-6 mt-4 bg-red-100 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800">
              <div className="flex">
                <HiExclamation className="w-5 h-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {/* Create New Dashboard Button */}
            <div className="mb-6">
              <button
                onClick={() => setIsCreating(true)}
                disabled={isLoading}
                className={classNames(
                  "inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md",
                  "bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <HiPlus className="w-4 h-4 mr-2" />
                Create New Dashboard
              </button>
            </div>

            {/* Create/Edit Form */}
            {(isCreating || editingDashboard) && (
              <div className="mb-6 p-4 bg-theme-100 dark:bg-theme-700 rounded-lg">
                <h4 className="text-md font-medium text-theme-900 dark:text-theme-100 mb-4">
                  {editingDashboard ? "Edit Dashboard" : "Create New Dashboard"}
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-theme-700 dark:text-theme-300">
                      Dashboard ID
                    </label>
                    <input
                      type="text"
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      disabled={editingDashboard || isLoading}
                      placeholder="work, personal, etc."
                      className={classNames(
                        "mt-1 block w-full rounded-md border-theme-300 dark:border-theme-600",
                        "bg-white dark:bg-theme-800 text-theme-900 dark:text-theme-100",
                        "focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
                      )}
                    />
                    <p className="mt-1 text-xs text-theme-500">
                      Lowercase letters, numbers, hyphens, and underscores only
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-theme-700 dark:text-theme-300">
                      Dashboard Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={isLoading}
                      placeholder="Work Dashboard"
                      className={classNames(
                        "mt-1 block w-full rounded-md border-theme-300 dark:border-theme-600",
                        "bg-white dark:bg-theme-800 text-theme-900 dark:text-theme-100",
                        "focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-theme-700 dark:text-theme-300">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={isLoading}
                      placeholder="Dashboard for work-related services"
                      rows={2}
                      className={classNames(
                        "mt-1 block w-full rounded-md border-theme-300 dark:border-theme-600",
                        "bg-white dark:bg-theme-800 text-theme-900 dark:text-theme-100",
                        "focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
                      )}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleCreateDashboard}
                      disabled={isLoading}
                      className={classNames(
                        "px-4 py-2 text-sm font-medium text-white rounded-md",
                        "bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      )}
                    >
                      {isLoading ? "Creating..." : editingDashboard ? "Save Changes" : "Create Dashboard"}
                    </button>
                    <button
                      onClick={resetForm}
                      disabled={isLoading}
                      className={classNames(
                        "px-4 py-2 text-sm font-medium rounded-md",
                        "text-theme-700 dark:text-theme-300 bg-theme-200 dark:bg-theme-600",
                        "hover:bg-theme-300 dark:hover:bg-theme-500 disabled:opacity-50"
                      )}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Dashboards List */}
            <div className="space-y-3">
              <h4 className="text-md font-medium text-theme-900 dark:text-theme-100">
                Existing Dashboards
              </h4>
              
              {dashboards.map((dashboard) => (
                <div
                  key={dashboard.id}
                  className={classNames(
                    "flex items-center justify-between p-4 rounded-lg border",
                    "border-theme-200 dark:border-theme-600 bg-white dark:bg-theme-700",
                    currentDashboard.id === dashboard.id && "ring-2 ring-blue-500"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h5 className="font-medium text-theme-900 dark:text-theme-100">
                        {dashboard.name}
                      </h5>
                      {dashboard.isDefault && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                          Default
                        </span>
                      )}
                      {currentDashboard.id === dashboard.id && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-theme-500 dark:text-theme-400">
                      {dashboard.description}
                    </p>
                    <p className="text-xs text-theme-400 dark:text-theme-500">
                      ID: {dashboard.id}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => switchDashboard(dashboard.id)}
                      disabled={currentDashboard.id === dashboard.id}
                      className={classNames(
                        "px-3 py-1 text-xs rounded-md",
                        currentDashboard.id === dashboard.id
                          ? "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800"
                      )}
                    >
                      {currentDashboard.id === dashboard.id ? "Active" : "Switch"}
                    </button>

                    {/* Configuration dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setConfigEditor({ isOpen: true, dashboardId: dashboard.id, configType: 'services' })}
                        className="p-2 text-theme-500 hover:text-theme-700 dark:text-theme-400 dark:hover:text-theme-200"
                        title="Edit Services"
                      >
                        <span className="text-xs">S</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setConfigEditor({ isOpen: true, dashboardId: dashboard.id, configType: 'bookmarks' })}
                      className="p-2 text-theme-500 hover:text-theme-700 dark:text-theme-400 dark:hover:text-theme-200"
                      title="Edit Bookmarks"
                    >
                      <span className="text-xs">B</span>
                    </button>

                    <button
                      onClick={() => setConfigEditor({ isOpen: true, dashboardId: dashboard.id, configType: 'widgets' })}
                      className="p-2 text-theme-500 hover:text-theme-700 dark:text-theme-400 dark:hover:text-theme-200"
                      title="Edit Widgets"
                    >
                      <span className="text-xs">W</span>
                    </button>

                    <button
                      onClick={() => setConfigEditor({ isOpen: true, dashboardId: dashboard.id, configType: 'settings' })}
                      className="p-2 text-theme-500 hover:text-theme-700 dark:text-theme-400 dark:hover:text-theme-200"
                      title="Edit Settings"
                    >
                      <HiCog className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleExportDashboard(dashboard.id)}
                      className="p-2 text-theme-500 hover:text-theme-700 dark:text-theme-400 dark:hover:text-theme-200"
                      title="Export Dashboard"
                    >
                      <HiDownload className="w-4 h-4" />
                    </button>

                    {!dashboard.isDefault && (
                      <button
                        onClick={() => setDeletingDashboard(dashboard)}
                        disabled={isLoading}
                        className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                        title="Delete Dashboard"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delete Confirmation */}
          {deletingDashboard && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white dark:bg-theme-800 rounded-lg p-6 max-w-md mx-4">
                <h4 className="text-lg font-medium text-theme-900 dark:text-theme-100 mb-4">
                  Delete Dashboard
                </h4>
                <p className="text-theme-700 dark:text-theme-300 mb-6">
                  Are you sure you want to delete &quot;{deletingDashboard.name}&quot;? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setDeletingDashboard(null)}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-theme-700 dark:text-theme-300 bg-theme-200 dark:bg-theme-600 rounded-md hover:bg-theme-300 dark:hover:bg-theme-500 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteDashboard(deletingDashboard.id)}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {isLoading ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Config Editor Modal */}
      <ConfigEditor
        dashboardId={configEditor.dashboardId}
        configType={configEditor.configType}
        isOpen={configEditor.isOpen}
        onClose={() => setConfigEditor({ isOpen: false, dashboardId: null, configType: null })}
      />
    </div>
  );
}