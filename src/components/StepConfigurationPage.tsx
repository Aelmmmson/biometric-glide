'use client';

import { useState, useEffect, useRef } from "react";
import {
  Save,
  Eye,
  Settings,
  RefreshCw,
  RotateCcw,
  Check,
  X,
  Play,
  Pause,
} from "lucide-react";
import { motion } from "framer-motion";
import { ProgressSidebar } from "./ProgressSidebar";
import { fetchActivityConfig, saveActivityConfig } from "@/services/api";

import type { ActivityConfig, ActivityConfigResponse } from "@/services/api";

interface StepConfig {
  id: number;
  title: string;
  description: string;
  required: boolean;
  enabled: boolean;
  defaultEnabled: boolean;
  dependencies: number[];
}

export function StepConfigurationPage() {
  const [steps, setSteps] = useState<StepConfig[]>([
    {
      id: 1,
      title: "Photo & Signature",
      description: "Capture your photo and signature",
      required: true,
      enabled: true,
      defaultEnabled: true,
      dependencies: [],
    },
    {
      id: 2,
      title: "Identification",
      description: "Verify your ID document",
      required: false,
      enabled: true,
      defaultEnabled: true,
      dependencies: [1],
    },
    {
      id: 3,
      title: "Fingerprint",
      description: "Capture your fingerprint",
      required: false,
      enabled: true,
      defaultEnabled: true,
      dependencies: [1],
    },
  ]);

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [mode, setMode] = useState<"capture" | "update">("capture");
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [loadAlert, setLoadAlert] = useState<
    "refresh_success" | "refresh_error" | null
  >(null);
  const [hasConnectionIssue, setHasConnectionIssue] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedInitially = useRef(false);

  // Load live config from backend
  const loadActivityConfig = async (suppressAlert: boolean = false) => {
    const isInitial = !hasLoadedInitially.current;

    if (isInitial) {
      setLoadingConfig(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const response: ActivityConfigResponse = await fetchActivityConfig();

      if (!response.success) {
        throw new Error(response.message || "Failed to load configuration");
      }

      if (response.data) {
        const config = response.data;
        setSteps((prev) =>
          prev.map((step) => {
            if (step.id === 1) {
              return { ...step, enabled: config.image.status, defaultEnabled: config.image.status };
            }
            if (step.id === 2) {
              return { ...step, enabled: config.identification.status, defaultEnabled: config.identification.status };
            }
            if (step.id === 3) {
              return { ...step, enabled: config.fingerprint.status, defaultEnabled: config.fingerprint.status };
            }
            return step;
          })
        );

        // Clear any previous connection issue on successful load
        setHasConnectionIssue(false);

        if (!isInitial && !suppressAlert) {
          setLoadAlert("refresh_success");
          setTimeout(() => setLoadAlert(null), 3000);
        }
      }
    } catch (err) {
      console.error("Failed to load activity config:", err);

      // On failure during initial load, show persistent connection issue banner
      if (isInitial) {
        setHasConnectionIssue(true);
      }

      // For manual refresh, show transient error (do not suppress for save reload)
      if (!isInitial && !suppressAlert) {
        setLoadAlert("refresh_error");
        setTimeout(() => setLoadAlert(null), 3000);
      }
    } finally {
      if (isInitial) {
        setLoadingConfig(false);
        hasLoadedInitially.current = true;
      } else {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadActivityConfig();
  }, []);

  // Save configuration to backend
  const saveConfiguration = async () => {
    setSaveStatus("saving");

    const configToSave: ActivityConfig = {
      image: { id: 4, status: steps.find((s) => s.id === 1)?.enabled ?? true },
      identification: { id: 5, status: steps.find((s) => s.id === 2)?.enabled ?? false },
      fingerprint: { id: 6, status: steps.find((s) => s.id === 3)?.enabled ?? false },
    };

    try {
      const result = await saveActivityConfig(configToSave);

      if (result.success) {
        setSaveStatus("saved");
        // Reload fresh config from server (suppress transient alert)
        await loadActivityConfig(true);
      } else {
        throw new Error(result.message || 'Save failed');
      }
    } catch (error) {
      console.error("Save failed:", error);
      setSaveStatus("error");
    } finally {
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const getVisibleStepsInOrder = () => {
    const enabledSteps = steps.filter((step) => step.enabled).map((step) => step.id);
    
    const orderedSteps: number[] = [];
    
    if (enabledSteps.includes(1)) orderedSteps.push(1);
    if (enabledSteps.includes(2)) orderedSteps.push(2);
    if (enabledSteps.includes(3)) orderedSteps.push(3);
    
    orderedSteps.push(4); // Review always last
    
    return orderedSteps;
  };

  const visibleSteps = getVisibleStepsInOrder();

  const configSummary = {
    totalVisibleSteps: visibleSteps.length - 1,
    requiredSteps: steps.filter((s) => s.required).length,
    optionalSteps: steps.filter((s) => s.enabled && !s.required).length,
    enabledBiometricSteps: steps.filter((s) => s.enabled).length,
    flowPattern: visibleSteps
      .map((stepId) => {
        if (stepId === 1) return "Photo";
        if (stepId === 2) return "ID";
        if (stepId === 3) return "FP";
        if (stepId === 4) return "Review";
        return "Step";
      })
      .join(" → "),
  };

  const toggleStep = (stepId: number) => {
    if (stepId === 1) return; // Photo cannot be disabled

    setSteps((prev) =>
      prev.map((step) => {
        if (step.id === stepId) {
          const newEnabled = !step.enabled;
          if (newEnabled && step.dependencies.length > 0) {
            const missingDeps = step.dependencies.filter((depId) => {
              const depStep = prev.find((s) => s.id === depId);
              return !depStep?.enabled;
            });
            if (missingDeps.length > 0) {
              alert(
                `Cannot enable this step. First enable: ${missingDeps
                  .map((depId) => prev.find((s) => s.id === depId)?.title)
                  .join(", ")}`
              );
              return step;
            }
          }
          return { ...step, enabled: newEnabled };
        }
        return step;
      })
    );
  };

  const resetToDefaults = () => {
    setSteps([
      {
        id: 1,
        title: "Photo & Signature",
        description: "Capture your photo and signature",
        required: true,
        enabled: true,
        defaultEnabled: true,
        dependencies: [],
      },
      {
        id: 2,
        title: "Identification",
        description: "Verify your ID document",
        required: false,
        enabled: true,
        defaultEnabled: true,
        dependencies: [1],
      },
      {
        id: 3,
        title: "Fingerprint",
        description: "Capture your fingerprint",
        required: false,
        enabled: true,
        defaultEnabled: true,
        dependencies: [1],
      },
    ]);
    setCurrentStep(1);
    setCompletedSteps([]);
    stopSimulation();
  };

  const stopSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setIsSimulating(false);
  };

  const startSimulation = () => {
    stopSimulation();
    setIsSimulating(true);
    setCurrentStep(1);
    setCompletedSteps([]);

    let stepIndex = 0;
    simulationIntervalRef.current = setInterval(() => {
      const currentStepId = visibleSteps[stepIndex];
      setCompletedSteps((prev) => [...prev, currentStepId]);
      stepIndex++;
      if (stepIndex < visibleSteps.length) {
        setCurrentStep(visibleSteps[stepIndex]);
      } else {
        stopSimulation();
      }
    }, 3000);
  };

  const simulateProgress = () => {
    if (isSimulating) stopSimulation();
    else startSimulation();
  };

  const resetPreview = () => {
    stopSimulation();
    setCurrentStep(1);
    setCompletedSteps([]);
  };

  useEffect(() => {
    return () => stopSimulation();
  }, []);

  const applyUseCase = (useCase: string) => {
    switch (useCase) {
      case "basic":
        setSteps((prev) =>
          prev.map((s) =>
            s.id === 3 ? { ...s, enabled: false } : s.id === 2 ? { ...s, enabled: true } : s
          )
        );
        break;
      case "full":
        setSteps((prev) => prev.map((s) => ({ ...s, enabled: true })));
        break;
      case "photo-fp":
        setSteps((prev) =>
          prev.map((s) =>
            s.id === 2 ? { ...s, enabled: false } : s.id === 3 ? { ...s, enabled: true } : s
          )
        );
        break;
      case "minimal":
        setSteps((prev) =>
          prev.map((s) => (s.id === 1 ? s : { ...s, enabled: false }))
        );
        break;
    }
    setCurrentStep(1);
    setCompletedSteps([]);
    stopSimulation();
  };

  if (loadingConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading current configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 truncate">
                Step Configuration
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                Configure biometric verification steps — live from backend
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => applyUseCase("basic")}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 font-medium bg-white shadow-sm"
                  title="Photo + ID only"
                >
                  Basic
                </button>
                <button
                  onClick={() => applyUseCase("full")}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 font-medium bg-white shadow-sm"
                  title="All steps"
                >
                  Full
                </button>
                <button
                  onClick={() => applyUseCase("photo-fp")}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 font-medium bg-white shadow-sm"
                  title="Skip ID verification"
                >
                  Photo+FP
                </button>
                <button
                  onClick={() => applyUseCase("minimal")}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 font-medium bg-white shadow-sm"
                  title="Only Photo & Signature"
                >
                  Minimal
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => loadActivityConfig()}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                <button
                  onClick={resetToDefaults}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
                <button
                  onClick={saveConfiguration}
                  disabled={saveStatus === "saving"}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  <Save className="w-4 h-4" />
                  {saveStatus === "saving" ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Persistent connection issue banner (only for initial load failure) */}
            {hasConnectionIssue && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <X className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-800 font-medium">
                    Unable to connect to the server
                  </p>
                  <p className="text-red-700 text-sm mt-1">
                    The configuration could not be loaded due to a connection error. Using default settings.
                  </p>
                </div>
                <button
                  onClick={() => loadActivityConfig()}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Transient alerts */}
            <div className="space-y-3">
              {saveStatus === "saved" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-700 text-sm font-medium">
                    Configuration saved successfully!
                  </span>
                </motion.div>
              )}
              {saveStatus === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <X className="w-4 h-4 text-red-600" />
                  <span className="text-red-700 text-sm font-medium">
                    Failed to save. Please try again.
                  </span>
                </motion.div>
              )}

              {loadAlert === "refresh_success" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-700 text-sm font-medium">
                    Configuration refreshed successfully!
                  </span>
                </motion.div>
              )}
              {loadAlert === "refresh_error" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <X className="w-4 h-4 text-red-600" />
                  <span className="text-red-700 text-sm font-medium">
                    Failed to refresh configuration. Please try again.
                  </span>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Live Preview */}
          <div className="lg:col-span-3">
            <div className="sticky top-6">
              <div className="bg-white rounded-xl shadow-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Live Preview</h2>
                    <p className="text-gray-600 text-sm">Sidebar as users see it</p>
                  </div>
                </div>
                <div className="mb-6">
                  <ProgressSidebar
                    currentStep={currentStep}
                    completedSteps={completedSteps}
                    visibleSteps={visibleSteps}
                    mode={mode}
                    relationNo={mode === "update" ? "REL-2024-001" : null}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Center: Step Configuration */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Settings className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Step Configuration</h2>
                    <p className="text-gray-600 text-xs">
                      Enable/disable each step. <span className="font-semibold">Note:</span> Photo & Signature is always required.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurable Steps</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {steps
                    .filter((step) => step.id !== 1)
                    .map((step) => (
                      <div
                        key={step.id}
                        className="p-5 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors bg-white h-full"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                              <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">
                                Step {step.id}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm">{step.description}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">Status</div>
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => toggleStep(step.id)}
                                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                                  step.enabled ? "bg-blue-600" : "bg-gray-300"
                                }`}
                              >
                                <span
                                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                    step.enabled ? "translate-x-8" : "translate-x-1"
                                  }`}
                                />
                              </button>
                              <div>
                                <div className="font-medium">{step.enabled ? "Enabled" : "Disabled"}</div>
                                <div className="text-xs text-gray-500">
                                  Step will {step.enabled ? "appear" : "not appear"} in the flow
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-md font-bold text-gray-900">Quick Controls</h3>
                      <span className="text-xs text-gray-500">Mode: {mode === "capture" ? "Capture" : "Update"}</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700 w-12">Mode:</span>
                        <div className="flex gap-1 flex-1">
                          <button
                            onClick={() => setMode("capture")}
                            className={`flex-1 px-2 py-1.5 rounded text-xs font-medium ${
                              mode === "capture"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            Capture
                          </button>
                          <button
                            onClick={() => setMode("update")}
                            className={`flex-1 px-2 py-1.5 rounded text-xs font-medium ${
                              mode === "update"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            Update
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700 w-12">Step:</span>
                        <div className="flex flex-wrap gap-1 flex-1">
                          {visibleSteps.map((stepId) => (
                            <button
                              key={stepId}
                              onClick={() => setCurrentStep(stepId)}
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                currentStep === stepId
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                              title={
                                stepId === 1
                                  ? "Photo & Signature"
                                  : stepId === 2
                                  ? "Identification"
                                  : stepId === 3
                                  ? "Fingerprint"
                                  : "Review"
                              }
                            >
                              {stepId === 1 ? "P" : stepId === 2 ? "ID" : stepId === 3 ? "FP" : "R"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700 w-12">Actions:</span>
                        <div className="flex gap-1 flex-1">
                          <button
                            onClick={simulateProgress}
                            className={`flex items-center justify-center gap-1 flex-1 px-2 py-1.5 rounded text-xs font-medium ${
                              isSimulating
                                ? "bg-yellow-600 text-white hover:bg-yellow-700"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                          >
                            {isSimulating ? (
                              <>
                                <Pause className="w-3 h-3" />
                                Stop
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3" />
                                Simulate
                              </>
                            )}
                          </button>
                          <button
                            onClick={resetPreview}
                            className="flex items-center justify-center gap-1 flex-1 px-2 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-xs font-medium"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-md font-bold text-gray-900">Preview Status</h3>
                      <span className="text-xs text-gray-500">
                        {completedSteps.length}/{visibleSteps.length} completed
                      </span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-medium text-gray-700">Flow Progress</div>
                            <div className="text-xs font-medium">
                              {completedSteps.length}/{visibleSteps.length}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {visibleSteps.map((stepId) => (
                              <div
                                key={stepId}
                                className={`flex-1 h-2 rounded-full ${
                                  completedSteps.includes(stepId)
                                    ? "bg-green-500"
                                    : currentStep === stepId
                                    ? "bg-blue-500"
                                    : "bg-gray-300"
                                }`}
                              ></div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            {visibleSteps.map((stepId) => (
                              <div key={stepId} className="flex flex-col items-center">
                                <div
                                  className={`w-3 h-3 rounded-full mb-1 ${
                                    completedSteps.includes(stepId)
                                      ? "bg-green-500"
                                      : currentStep === stepId
                                      ? "bg-blue-500"
                                      : "bg-gray-400"
                                  }`}
                                ></div>
                                <div className="text-xs font-medium">
                                  {stepId === 1
                                    ? "Photo"
                                    : stepId === 2
                                    ? "ID"
                                    : stepId === 3
                                    ? "FP"
                                    : "Review"}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {isSimulating && (
                          <div className="bg-blue-50 p-2 rounded border border-blue-200">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                              <div className="text-xs text-blue-700 font-medium">
                                Simulating: {currentStep === 1 ? "Photo" : currentStep === 2 ? "ID" : currentStep === 3 ? "FP" : "Review"}
                                {completedSteps.includes(currentStep) ? " ✓" : " (in progress)"}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Applied Settings */}
          <div className="lg:col-span-3">
            <div className="sticky top-6 space-y-4">
              <div className="bg-white rounded-xl shadow-card p-5">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Applied Settings</h2>
                <div className="mb-4 grid grid-cols-2 gap-2">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-xl font-bold text-blue-600">{configSummary.totalVisibleSteps}</div>
                    <div className="text-xs text-gray-600">Steps</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-xl font-bold text-green-600">
                      {configSummary.optionalSteps + (configSummary.requiredSteps - 1)}
                    </div>
                    <div className="text-xs text-gray-600">Optional</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-700">Step Status</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm">Photo</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-800 rounded">R</span>
                        <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800 rounded">On</span>
                      </div>
                    </div>
                    {steps
                      .filter((step) => step.id !== 1)
                      .map((step) => (
                        <div key={step.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${step.enabled ? "bg-green-500" : "bg-gray-400"}`}
                            ></div>
                            <span className="text-sm">{step.title.split(" ")[0]}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded ${
                                step.enabled
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {step.enabled ? "On" : "Off"}
                            </span>
                          </div>
                        </div>
                      ))}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm">Review</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800 rounded">On</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-card p-5">
                <div className="text-sm font-medium text-gray-700 mb-3">Quick Info</div>
                <ul className="text-xs text-gray-600 space-y-1.5">
                  <li className="flex items-start gap-1.5">
                    <div className="w-1 h-1 bg-gray-400 rounded-full mt-1 flex-shrink-0"></div>
                    <span>Photo always required</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <div className="w-1 h-1 bg-gray-400 rounded-full mt-1 flex-shrink-0"></div>
                    <span>ID and FP are always optional</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <div className="w-1 h-1 bg-gray-400 rounded-full mt-1 flex-shrink-0"></div>
                    <span>Review always shows (not counted)</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <div className="w-1 h-1 bg-gray-400 rounded-full mt-1 flex-shrink-0"></div>
                    <span>ID/FP depend on Photo</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <div className="w-1 h-1 bg-gray-400 rounded-full mt-1 flex-shrink-0"></div>
                    <span>Flow order: Photo → ID → FP → Review</span>
                  </li>
                </ul>

                {steps.filter((s) => s.id !== 1 && s.enabled).length === 0 && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    Only Photo enabled. Add ID or FP for better verification.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}