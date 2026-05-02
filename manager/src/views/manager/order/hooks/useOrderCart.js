import { useEffect } from 'react';

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
      // ONLY merge with non-completed items
      const existingItemIndex = prevItems.findIndex(
        (orderItem) => orderItem.dish_name === item.dish_name && (orderItem.status === 'Pending' || orderItem.status === 'Preparing')
      );

      if (existingItemIndex > -1) {
        return prevItems.map((orderItem, index) => (index === existingItemIndex ? { ...orderItem, quantity: orderItem.quantity + 1 } : orderItem));
      }

      // ✅ Always add NEW item if completed already
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
