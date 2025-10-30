import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

console.log('process.env.NEXT_APP_PUBLIC_API_URL',process.env.NEXT_APP_PUBLIC_API_URL);


// Create Axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_APP_PUBLIC_API_URL || "http://localhost:9090/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // if you use cookies for auth
});

// ======================
// 🔐 Request Interceptor
// ======================
api.interceptors.request.use(
  (config) => {
    // Optionally attach token
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ======================
// ⚙️ Response Interceptor
// ======================
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized! Redirecting to login...");
      // Optionally redirect user
      // window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);

// ======================
// 🧩 Helper Methods
// ======================
export const apiGet = <T>(url: string, config?: AxiosRequestConfig) =>
  api.get<T>(url, config).then((res) => res.data);

export const apiPost = <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
  api.post<T>(url, data, config).then((res) => res.data);

export const apiPatch = <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
  api.patch<T>(url, data, config).then((res) => res.data);

export const apiDelete = <T>(url: string, config?: AxiosRequestConfig) =>
  api.delete<T>(url, config).then((res) => res.data);

export const apiUpload = async <T>(
  url: string,
  formData: FormData,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await api.post<T>(url, formData, {
      ...config,
      headers: {
        ...(config?.headers || {}),
        Authorization: config?.headers?.Authorization,
        "Content-Type": "multipart/form-data", // ✅ important
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Upload failed:", error.response || error);
    throw error;
  }
};

// Default export
export default api;
