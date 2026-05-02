import { useState, useEffect } from 'react';
import { getMenuData as fetchMenuDataService, getCategories as fetchCategoriesService } from 'api/orderService';

const useMenuFetcher = () => {
  const [menuData, setMenuData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showSpecial, setShowSpecial] = useState(false);

  const fetchMenuData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetchMenuDataService({ searchText, category: selectedCategory }, token);
      setMenuData(response.data.data);
    } catch (error) {
      console.error('Error fetching menu data:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetchCategoriesService(token);
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchMenuData();
    fetchCategories();
    // Explicitly run only on mount to match existing logic
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredMenuData = menuData
    .map((category) => ({
      ...category,
      dishes: category.dishes.filter(
        (dish) =>
          dish.dish_name.toLowerCase().includes(searchText.toLowerCase()) &&
          (selectedCategory === '' || category.category === selectedCategory) &&
          (!showSpecial || dish.is_special) &&
          dish.is_available
      ),
    }))
    .filter((category) => category.dishes.length > 0);

  return {
    menuData,
    categories,
    filteredMenuData,
    searchText,
    setSearchText,
    selectedCategory,
    setSelectedCategory,
    showSpecial,
    setShowSpecial,
  };
};

export default useMenuFetcher;
