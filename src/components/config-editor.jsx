import { useState, useEffect, useRef } from "react";
import { useTranslation } from "next-i18next";
import { HiX, HiCode, HiEye, HiSave, HiRefresh } from "react-icons/hi";
import classNames from "classnames";
import { mutate } from "swr";

export default function ConfigEditor({ dashboardId, configType, isOpen, onClose }) {
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const [config, setConfig] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPreview, setIsPreview] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setConfig("");
      setError("");
      setSuccess("");
      setIsPreview(false);
      setIsLoading(false);
      setIsSaving(false);
    }
  }, [isOpen]);

  const configTitles = {
    services: "Services Configuration",
    bookmarks: "Bookmarks Configuration", 
    widgets: "Widgets Configuration",
    settings: "Settings Configuration"
  };

  const configDescriptions = {
    services: "Define your service groups and individual services",
    bookmarks: "Configure bookmark groups and links",
    widgets: "Set up information widgets for your dashboard",
    settings: "Customize dashboard appearance and behavior"
  };

  const exampleConfigs = {
    services: `---
# For configuration options and examples, please see:
# https://gethomepage.dev/configs/services/

- Development:
    - GitHub:
        href: https://github.com
        description: Code repository
        icon: github
        
- Productivity:
    - Notion:
        href: https://notion.so
        description: Notes and planning
        icon: notion`,

    bookmarks: `---
# For configuration options and examples, please see:
# https://gethomepage.dev/configs/bookmarks/

- Developer bookmarks:
    - Github:
        - href: https://github.com/
    - MDN:
        - href: https://developer.mozilla.org/

- Social:
    - Reddit:
        - href: https://reddit.com/`,

    widgets: `---
# For configuration options and examples, please see:
# https://gethomepage.dev/widgets/

- resources:
    label: System
    cpu: true
    memory: true
    disk: /

- search:
    provider: duckduckgo
    target: _blank`,

    settings: `---
# For configuration options and examples, please see:
# https://gethomepage.dev/configs/settings/

title: My Dashboard
favicon: https://cdn.jsdelivr.net/gh/walkxhub/dashboard-icons/png/homepage.png

background:
  image: https://images.unsplash.com/photo-1502790671504-542ad42d5189
  blur: sm
  saturate: 50
  brightness: 50
  opacity: 20

theme: dark
color: slate

headerStyle: underlined
hideVersion: false`
  };


  useEffect(() => {
    if (dashboardId && configType) {
      loadConfig();
    } else {
      // Reset state if no props
      setConfig("");
      setError("");
      setSuccess("");
      setIsPreview(false);
      setIsLoading(false);
      setIsSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardId, configType]);

  const loadConfig = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch(`/api/config/dashboards/${dashboardId}/${configType}.yaml`);
      if (response.ok) {
        const text = await response.text();
        setConfig(text);
      } else if (response.status === 404) {
        // Config doesn't exist, use example
        setConfig(exampleConfigs[configType] || "");
      } else {
        throw new Error(`Failed to load configuration: ${response.statusText}`);
      }
    } catch (err) {
      setError(err.message);
      setConfig(exampleConfigs[configType] || "");
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");
    
    try {
      // First validate the YAML by attempting to parse it
      const yaml = await import("js-yaml");
      yaml.load(config);
      
      const response = await fetch("/api/config/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dashboardId,
          configType,
          content: config
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save configuration");
      }

      setSuccess("Configuration saved successfully!");
      
      // Refresh the data in the main app
      const dashboardParam = dashboardId !== "default" ? `?dashboard=${dashboardId}` : "";
      await mutate(`/api/${configType}${dashboardParam}`);
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      if (err.name === "YAMLException") {
        setError(`YAML Syntax Error: ${err.message}`);
      } else {
        setError(err.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const resetToExample = () => {
    setConfig(exampleConfigs[configType] || "");
    setError("");
    setSuccess("");
  };

  return (
    <div className="w-full max-w-6xl overflow-hidden text-left align-middle bg-theme-50 dark:bg-theme-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-theme-200 dark:border-theme-700">
            <div>
              <h3 className="text-lg font-medium text-theme-900 dark:text-theme-100">
                {configTitles[configType]}
              </h3>
              <p className="text-sm text-theme-500 dark:text-theme-400">
                {configDescriptions[configType]} • Dashboard: {dashboardId}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPreview(!isPreview)}
                className={classNames(
                  "inline-flex items-center px-3 py-1 text-sm rounded-md",
                  isPreview 
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    : "bg-theme-200 text-theme-700 dark:bg-theme-600 dark:text-theme-300"
                )}
              >
                {isPreview ? <HiEye className="w-4 h-4 mr-1" /> : <HiCode className="w-4 h-4 mr-1" />}
                {isPreview ? "Preview" : "Code"}
              </button>
              
              <button
                onClick={onClose}
                className="text-theme-400 hover:text-theme-600 dark:text-theme-500 dark:hover:text-theme-300"
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="p-4 mx-6 mt-4 bg-red-100 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="p-4 mx-6 mt-4 bg-green-100 border border-green-200 rounded-md dark:bg-green-900/20 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Editor */}
                <div className="relative">
                  <textarea
                    value={config}
                    onChange={(e) => setConfig(e.target.value)}
                    placeholder={`Enter your ${configType} configuration here...`}
                    rows={20}
                    className={classNames(
                      "w-full p-4 font-mono text-sm rounded-lg border",
                      "border-theme-300 dark:border-theme-600",
                      "bg-white dark:bg-theme-900 text-theme-900 dark:text-theme-100",
                      "focus:border-blue-500 focus:ring-blue-500 resize min-h-96"
                    )}
                    style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <button
                      onClick={resetToExample}
                      disabled={isSaving || isLoading}
                      className={classNames(
                        "inline-flex items-center px-4 py-2 text-sm rounded-md",
                        "text-theme-700 dark:text-theme-300 bg-theme-200 dark:bg-theme-600",
                        "hover:bg-theme-300 dark:hover:bg-theme-500 disabled:opacity-50"
                      )}
                    >
                      <HiRefresh className="w-4 h-4 mr-2" />
                      Load Example
                    </button>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={loadConfig}
                      disabled={isSaving || isLoading}
                      className={classNames(
                        "px-4 py-2 text-sm font-medium rounded-md",
                        "text-theme-700 dark:text-theme-300 bg-theme-200 dark:bg-theme-600",
                        "hover:bg-theme-300 dark:hover:bg-theme-500 disabled:opacity-50"
                      )}
                    >
                      Reload
                    </button>
                    
                    <button
                      onClick={saveConfig}
                      disabled={isSaving || isLoading}
                      className={classNames(
                        "inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md",
                        "bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      )}
                    >
                      <HiSave className="w-4 h-4 mr-2" />
                      {isSaving ? "Saving..." : "Save Configuration"}
                    </button>
                  </div>
                </div>

                {/* Help Text */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                    Configuration Help
                  </h4>
                  <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                    <li>• Use YAML format for all configurations</li>
                    <li>• Indentation matters - use 2 or 4 spaces consistently</li>
                    <li>• Check the <a href="https://gethomepage.dev" target="_blank" rel="noopener noreferrer" className="underline">official documentation</a> for all available options</li>
                    <li>• Changes are applied immediately after saving</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
    </div>
  );
}