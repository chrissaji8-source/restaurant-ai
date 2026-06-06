import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  withCredentials: true
});

let currentToken = null;
export const setAccessToken = (token) => {
  currentToken = token;
};

client.interceptors.request.use((config) => {
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh') {
      originalRequest._retry = true;
      try {
        const res = await axios.post(`${client.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true });
        const { accessToken } = res.data;
        setAccessToken(accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const getInsights = (restaurantId) => client.get(`/insights/${restaurantId}`).then(res => res.data);
export const getCampaigns = (restaurantId) => client.get(`/campaigns?restaurantId=${restaurantId}`).then(res => res.data);
export const getForecast = (restaurantId) => client.get(`/forecast?restaurantId=${restaurantId}`).then(res => res.data);
export const getRestaurant = (id) => client.get(`/restaurants/${id}`).then(res => res.data);

export default client;
