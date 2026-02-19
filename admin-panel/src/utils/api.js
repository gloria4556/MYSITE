import axios from "axios";

// API client: use REACT_APP_API_URL to point to your backend (e.g. http://localhost:8000)
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Attach admin access token
api.interceptors.request.use((config) => {
  try {
    const admin = JSON.parse(localStorage.getItem("adminUser")) || {};
    const token =
      admin.token ||
      admin.access ||
      (admin.data && (admin.data.token || admin.data.access));
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      const admin = JSON.parse(localStorage.getItem("adminUser") || "{}");
      if (!admin?.refresh) {
        localStorage.removeItem("adminUser");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = "Bearer " + token;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const baseURL = api.defaults.baseURL || "http://localhost:8000";
        const resp = await axios.post(`${baseURL}/api/token/refresh/`, {
          refresh: admin.refresh,
        });
        const newAccess = resp.data.access;
        // persist
        admin.access = newAccess;
        admin.token = newAccess;
        localStorage.setItem("adminUser", JSON.stringify(admin));
        processQueue(null, newAccess);
        originalRequest.headers.Authorization = "Bearer " + newAccess;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem("adminUser");
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
