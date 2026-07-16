import { useState, useEffect } from 'react';
import { getCatalogData as fetchCatalogDataService, getCategories as fetchCategoriesService } from '../../../../api/orderService';

const useCatalogFetcher = () => {
  const [catalogData, setCatalogData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showSpecial, setShowSpecial] = useState(false);

  const fetchCatalogData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetchCatalogDataService({ searchText, category: selectedCategory }, token);
      setCatalogData(response.data.data);
    } catch (error) {
      console.error('Error fetching catalog data:', error);
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
    fetchCatalogData();
    fetchCategories();
    // Explicitly run only on mount to match existing logic
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCatalogData = catalogData
    .map((category) => ({
      ...category,
      items: category.items.filter(
        (item) =>
          item.item_name.toLowerCase().includes(searchText.toLowerCase()) &&
          (selectedCategory === '' || category.category === selectedCategory) &&
          (!showSpecial || item.is_special) &&
          item.is_available
      ),
    }))
    .filter((category) => category.items.length > 0);

  return {
    catalogData,
    categories,
    filteredCatalogData,
    searchText,
    setSearchText,
    selectedCategory,
    setSelectedCategory,
    showSpecial,
    setShowSpecial,
  };
};

export default useCatalogFetcher;
