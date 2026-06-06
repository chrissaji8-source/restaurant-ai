import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

export const getInsights = (restaurantId) => client.get(`/insights/${restaurantId}`).then(res => res.data);
export const getCampaigns = (restaurantId) => client.get(`/campaigns?restaurantId=${restaurantId}`).then(res => res.data);
export const getForecast = (restaurantId) => client.get(`/forecast?restaurantId=${restaurantId}`).then(res => res.data);
export const getRestaurant = (id) => client.get(`/restaurants/${id}`).then(res => res.data);

export default client;
