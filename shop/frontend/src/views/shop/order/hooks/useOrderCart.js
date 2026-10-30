import { useEffect } from 'react';

const areItemsEqual = (itemA, itemB) => {
  if (itemA.item_name !== itemB.item_name) return false;

  // Check unit matching (Box vs Piece)
  if ((itemA.selected_unit || 'box') !== (itemB.selected_unit || 'box')) return false;

  // Check variant matching
  const varA = itemA.selected_variant;
  const varB = itemB.selected_variant;
  if (varA || varB) {
    if (!varA || !varB) return false;
    if (varA.size_name !== varB.size_name) return false;
    if (Number(varA.price) !== Number(varB.price)) return false;
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
      console.log('Item status updated:', updatedOrderId, status);

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
    let itemWithVariant = { ...item };
    if (!itemWithVariant.selected_variant && Array.isArray(itemWithVariant.variants) && itemWithVariant.variants.length > 0) {
      const defaultVariant = itemWithVariant.variants[0];
      if (defaultVariant && (defaultVariant.size_name || defaultVariant.extra)) {
        itemWithVariant.selected_variant = {
          size_name: defaultVariant.size_name || '',
          price: Number(defaultVariant.price),
          extra: defaultVariant.extra || '',
        };
      }
    }

    // Preserve box and piece pricing for loose-enabled items
    if (itemWithVariant.allow_loose) {
      const boxPrice = itemWithVariant.box_price != null ? Number(itemWithVariant.box_price) : Number(itemWithVariant.item_price || 0);
      const unit = itemWithVariant.selected_unit || 'box';
      const activePrice = unit === 'piece' && itemWithVariant.piece_price != null ? Number(itemWithVariant.piece_price) : boxPrice;
      itemWithVariant.box_price = boxPrice;
      itemWithVariant.selected_unit = unit;
      itemWithVariant.item_price = activePrice;
    }

    setOrderItems((prevItems) => {
      // ONLY merge with non-completed items that have identical customizations and unit
      const existingItemIndex = prevItems.findIndex(
        (orderItem) => areItemsEqual(orderItem, itemWithVariant) && (orderItem.status === 'Pending' || orderItem.status === 'Preparing')
      );

      if (existingItemIndex > -1) {
        return prevItems.map((orderItem, index) => (index === existingItemIndex ? { ...orderItem, quantity: orderItem.quantity + 1 } : orderItem));
      }

      // Always add NEW item if completed already or customization/unit differs
      return [
        ...prevItems,
        {
          ...itemWithVariant,
          quantity: 1,
          status: 'Pending',
        },
      ];
    });
  };

  const updateItemQuantity = (itemIndex, change) => {
    setOrderItems((prevItems) => prevItems.map((item, index) => (index === itemIndex ? { ...item, quantity: Math.max(1, item.quantity + change) } : item)));
  };

  const updateItemUnit = (itemIndex, newUnit) => {
    setOrderItems((prevItems) =>
      prevItems.map((item, index) => {
        if (index !== itemIndex) return item;
        const boxPrice = item.box_price != null ? Number(item.box_price) : Number(item.item_price || 0);
        const pcPrice = item.piece_price != null ? Number(item.piece_price) : (item.pieces_per_box ? Number((boxPrice / item.pieces_per_box).toFixed(2)) : boxPrice);
        const targetPrice = newUnit === 'piece' ? pcPrice : boxPrice;
        return {
          ...item,
          selected_unit: newUnit,
          box_price: boxPrice,
          item_price: targetPrice,
        };
      })
    );
  };

  const removeItem = (itemIndex) => {
    setOrderItems((prevItems) => prevItems.filter((_, index) => index !== itemIndex));
  };

  return {
    addItemToOrder,
    updateItemQuantity,
    updateItemUnit,
    removeItem,
  };
};

export default useOrderCart;
