import axios from "axios";
import { useNavigate } from "react-router-dom";

// สร้าง Axios Instance
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Interceptor สำหรับจัดการ Error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized: Please log in again.");
      // ลบบรรทัดนี้: window.location.href = "/login";
    }
    return Promise.reject(error.response ? error.response.data : error.message);
  }
);

export default api;
