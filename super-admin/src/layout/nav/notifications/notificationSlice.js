import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  status: 'idle',
  items: [],
};

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    notificationsLoading(state) {
      state.status = 'loading';
    },
    notificationsLoaded(state, action) {
      state.items = action.payload;
      state.status = 'idle';
    },
    addNotification(state, action) {
      // Add new notification at the beginning of the list
      state.items.unshift(action.payload);
    },
    markAllAsRead(state) {
      state.items = state.items.map((item) => ({ ...item, read: true }));
    },
    markSingleAsRead(state, action) {
      const item = state.items.find((i) => i._id === action.payload);
      if (item) {
        item.read = true;
      }
    },
    removeNotification(state, action) {
      state.items = state.items.filter((i) => i._id !== action.payload);
    },
    clearAll(state) {
      state.items = [];
    },
  },
});

export const {
  notificationsLoading,
  notificationsLoaded,
  addNotification,
  markAllAsRead,
  markSingleAsRead,
  removeNotification,
  clearAll,
} = notificationSlice.actions;

export const fetchNotifications = () => async (dispatch) => {
  dispatch(notificationsLoading());
  try {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/superadmin/inquiries`, getHeaders());
    if (response.data && response.data.data) {
      const inquiries = response.data.data;
      const unreadInquiries = inquiries.filter(inq => inq.status === "Pending");
      
      const notifications = unreadInquiries.slice(0, 5).map(inq => ({
        _id: inq._id,
        detail: `New inquiry from ${inq.name || 'User'}`,
        link: '/inquiries',
        icon: 'message',
        read: false
      }));

      dispatch(notificationsLoaded(notifications));
    } else {
      dispatch(notificationsLoaded([]));
    }
  } catch (error) {
    console.error("Error fetching notifications:", error);
    dispatch(notificationsLoaded([]));
  }
};

export const markNotificationsRead = () => async (dispatch) => {
  try {
    await axios.put(`${process.env.REACT_APP_API}/notifications/mark-read`, {}, getHeaders());
    dispatch(markAllAsRead());
  } catch (error) {
    console.error("Error marking notifications as read:", error);
  }
};

export const markSingleNotificationRead = (id) => async (dispatch) => {
  try {
    await axios.put(`${process.env.REACT_APP_API}/notifications/mark-read/${id}`, {}, getHeaders());
    dispatch(markSingleAsRead(id));
  } catch (error) {
    console.error("Error marking notification read:", error);
  }
};

export const deleteSingleNotification = (id) => async (dispatch) => {
  try {
    await axios.delete(`${process.env.REACT_APP_API}/notifications/${id}`, getHeaders());
    dispatch(removeNotification(id));
  } catch (error) {
    console.error("Error deleting notification:", error);
  }
};

export const clearAllNotifications = () => async (dispatch) => {
  try {
    await axios.delete(`${process.env.REACT_APP_API}/notifications`, getHeaders());
    dispatch(clearAll());
  } catch (error) {
    console.error("Error clearing notifications:", error);
  }
};

const notificationReducer = notificationSlice.reducer;
export default notificationReducer;

