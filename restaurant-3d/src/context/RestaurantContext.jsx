import { createContext, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const RestaurantContext = createContext(null);

export function RestaurantProvider({ children }) {
  const { restaurantCode } = useParams();
  const [settings, setSettings] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!restaurantCode) return;

    const fetchRestaurantData = async () => {
      setLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

        // Fetch Settings
        const settingsRes = await fetch(`${API_URL}/website/settings/${restaurantCode}`);
        if (!settingsRes.ok) throw new Error('Failed to fetch settings');
        const settingsData = await settingsRes.json();

        // Fetch Featured Dishes
        const dishesRes = await fetch(`${API_URL}/website/featured-dishes/${restaurantCode}`);
        const dishesData = dishesRes.ok ? await dishesRes.json() : [];

        // Fetch Full Menu
        const menuRes = await fetch(`${API_URL}/website/menu/${restaurantCode}`);
        const menuData = menuRes.ok ? await menuRes.json() : [];

        setSettings(settingsData);
        setDishes(dishesData);
        setMenu(menuData);

        // Update Document Title and Favicon
        if (settingsData.restaurant_name) {
          document.title = settingsData.restaurant_name;
        }
        if (settingsData.logo) {
          let link = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = `${API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL}/uploads/menu/${settingsData.logo}`;
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [restaurantCode]);

  return (
    <RestaurantContext.Provider value={{ restaurantCode, settings, dishes, menu, loading, error }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export const useRestaurant = () => {
  const ctx = useContext(RestaurantContext);
  if (!ctx) throw new Error('useRestaurant must be inside RestaurantProvider');
  return ctx;
};
