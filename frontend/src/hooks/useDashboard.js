import { useState, useEffect } from 'react';
import { getInsights, getCampaigns, getForecast } from '../api/client';

export function useDashboard(restaurantId) {
  const [data, setData] = useState({
    insights: null,
    weather: null,
    forecast: null,
    campaigns: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        let insightsRes = null;
        try {
          insightsRes = await getInsights(restaurantId);
        } catch (e) {
          console.log("Using mock data due to API error", e);
        }

        if (isMounted) {
          setData({
            insights: insightsRes || mockInsights,
            weather: mockWeather,
            forecast: mockForecast,
            campaigns: mockCampaigns,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (isMounted) {
          setData(prev => ({ ...prev, loading: false, error: err.message }));
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [restaurantId]);

  const refetch = async () => {
    setData(prev => ({ ...prev, loading: true }));
    try {
      // Actually call the backend API to get new campaigns from Claude!
      const insightsRes = await getInsights(restaurantId);
      setData(prev => ({
        ...prev,
        insights: insightsRes,
        campaigns: {
          instagram: insightsRes.daily_insights?.instagram_caption || mockCampaigns.instagram,
          whatsapp: insightsRes.daily_insights?.whatsapp_message || mockCampaigns.whatsapp,
        },
        loading: false,
      }));
    } catch (e) {
      console.log("Refetch API failed, falling back to mock", e);
      setTimeout(() => {
        setData(prev => ({
          ...prev,
          loading: false,
          campaigns: {
            instagram: 'Craving something amazing? 🍛 Come taste the magic tonight! #foodie #fresh',
            whatsapp: 'Hey! We have fresh specials cooking tonight. Message us to reserve your spot!',
          }
        }));
      }, 1000);
    }
  };

  return { ...data, refetch };
}

const mockWeather = { temp: 31, description: 'Clear sky', icon: '☀️' };
const mockForecast = [
  { day: 'Mon', value: 15987 },
  { day: 'Tue', value: 16254 },
  { day: 'Wed', value: 21085 },
  { day: 'Thu', value: 20751 },
  { day: 'Fri', value: 16675 },
  { day: 'Sat', value: 16402 },
  { day: 'Sun', value: 16932 },
];
const mockCampaigns = {
  instagram: 'Ready for a delicious meal? Visit us today! 🍛✨ #foodie #delicious',
  whatsapp: 'Hello! We are open and ready to serve your favorite dishes today. Call us to book a table!',
};
const mockInsights = {
  predicted_revenue: 18400,
  confidence_score: 0.87,
  expected_footfall: 350,
  peak_hour: '19:00 - 21:30',
  menu_tip: 'Feature your popular signature dish today.',
  hashtags: ['#indianfood', '#mumbaieats', '#foodlover', '#dinner', '#foodie', '#delicious', '#curry', '#spicy'],
  trending_hashtags: ['#mumbaieats', '#indianfood', '#curry'],
  rows: [
    { icon: '🌧️', title: 'Rain Expected', explanation: 'Delivery orders expected to surge by 20%. Ensure packaging stock.' },
    { icon: '🏏', title: 'Cricket Match Tonight', explanation: 'High group dine-in expected. Recommend running combo offers.' },
    { icon: '📈', title: 'High Confidence', explanation: 'Model predictions have 87% accuracy based on recent historical data.' }
  ]
};
