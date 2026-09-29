import { useMutation } from "@tanstack/react-query";
import { Config, TransformerConfig } from "~/types/index";
import { API_CONFIG } from "~/util/config";

const downloadFile = async (config: Config): Promise<Blob> => {
  const response = await fetch(API_CONFIG.getApiUrl("/generate"), {
    method: "POST",
    body: JSON.stringify(config),
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Download failed: ${response.status} ${response.statusText}`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const err = await response.json().catch(() => null);
    const message =
      err && typeof err.error === "string"
        ? err.error
        : "Notebook generation failed";
    throw new Error(message);
  }

  return response.blob();
};

const startTransformerTraining = async (config: TransformerConfig) => {
  const response = await fetch(
    API_CONFIG.getApiUrl("/transformertrain"),
    {
      method: "POST",
      body: JSON.stringify(config),
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Transformer training failed: ${response.status} ${response.statusText}`,
    );
  }
};

const transformerTest = async (params: {
  temperature: number;
  prompt: string;
}) => {
  const response = await fetch(
    API_CONFIG.getApiUrl("/transformertest"),
    {
      method: "POST",
      body: JSON.stringify(params),
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Transformer test failed: ${response.status} ${response.statusText}`,
    );
  }
};

const checkServerHealth = async () => {
  const response = await fetch(API_CONFIG.getApiUrl("/health"), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Health check failed: ${response.status} ${response.statusText}`,
    );
  }
};

// hooks
export const useDownloadFile = () => {
  return useMutation({
    mutationFn: downloadFile,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "generated_notebook.ipynb";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onError: (error) => {
      console.error("Error downloading file:", error);
    },
  });
};

export const useStartTransformerTraining = () => {
  return useMutation({
    mutationFn: startTransformerTraining,
    onSuccess: (data) => {
      console.log("Transformer training completed:", data);
    },
    onError: (error) => {
      console.error("Transformer training error:", error);
    },
  });
};

export const useTransformerTest = () => {
  return useMutation({
    mutationFn: transformerTest,
  });
};

export const useServerHealth = () => {
  return useMutation({
    mutationFn: checkServerHealth,
  });
};

// Raw API functions for backward compatibility
export {
  downloadFile as downloadFileApi,
  startTransformerTraining as startTransformerTrainingApi,
  transformerTest as transformerTestApi,
  checkServerHealth as checkServerHealthApi,
};
