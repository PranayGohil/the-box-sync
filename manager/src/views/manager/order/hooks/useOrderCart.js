import { useEffect } from 'react';

const areItemsEqual = (itemA, itemB) => {
  if (itemA.dish_name !== itemB.dish_name) return false;

  // Check variant matching
  const varA = itemA.selected_variant;
  const varB = itemB.selected_variant;
  if (varA || varB) {
    if (!varA || !varB) return false;
    if (varA.size_name !== varB.size_name) return false;
  }

  // Check addons matching
  const addonsA = itemA.selected_addons || [];
  const addonsB = itemB.selected_addons || [];
  if (addonsA.length !== addonsB.length) return false;

  // Sort and compare addon names to be order-independent
  const namesA = addonsA.map((a) => a.addon_name).sort();
  const namesB = addonsB.map((a) => a.addon_name).sort();
  for (let i = 0; i < namesA.length; i += 1) {
    if (namesA[i] !== namesB[i]) return false;
  }

  return true;
};

const useOrderCart = ({ setOrderItems, socket, orderId, fetchOrderDetails }) => {
  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const handleDishStatusUpdate = ({ orderId: updatedOrderId, status }) => {
      console.log('Dish status updated:', updatedOrderId, status);

      // Refresh only if this order is currently open
      if (updatedOrderId === orderId) {
        fetchOrderDetails();
      }
    };

    socket.on('dish_status_updated', handleDishStatusUpdate);

    return () => {
      socket.off('dish_status_updated', handleDishStatusUpdate);
    };
  }, [socket, orderId, fetchOrderDetails]);

  // Order item management
  const addItemToOrder = (item) => {
    setOrderItems((prevItems) => {
      // ONLY merge with non-completed items that have identical customizations
      const existingItemIndex = prevItems.findIndex(
        (orderItem) => areItemsEqual(orderItem, item) && (orderItem.status === 'Pending' || orderItem.status === 'Preparing')
      );

      if (existingItemIndex > -1) {
        return prevItems.map((orderItem, index) => (index === existingItemIndex ? { ...orderItem, quantity: orderItem.quantity + 1 } : orderItem));
      }

      // ✅ Always add NEW item if completed already or customization differs
      return [
        ...prevItems,
        {
          ...item,
          quantity: 1,
          status: 'Pending',
        },
      ];
    });
  };

  const updateItemQuantity = (itemIndex, change) => {
    setOrderItems((prevItems) => prevItems.map((item, index) => (index === itemIndex ? { ...item, quantity: Math.max(1, item.quantity + change) } : item)));
  };

  const removeItem = (itemIndex) => {
    setOrderItems((prevItems) => prevItems.filter((_, index) => index !== itemIndex));
  };

  return {
    addItemToOrder,
    updateItemQuantity,
    removeItem,
  };
};

export default useOrderCart;
