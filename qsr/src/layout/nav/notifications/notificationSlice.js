import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { SERVICE_URL } from 'config.js';

const initialState = {
  status: 'idle',
  items: [],
};

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
  },
});

export const { notificationsLoading, notificationsLoaded } = notificationSlice.actions;

export const fetchNotifications = () => async (dispatch) => {
  dispatch(notificationsLoading());
  try {
    const response = await axios.get(`${process.env.REACT_APP_API}/notifications`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (response.data && response.data.success) {
      dispatch(notificationsLoaded(response.data.data));
    } else {
      dispatch(notificationsLoaded([]));
    }
  } catch (error) {
    console.error("Error fetching notifications:", error);
    dispatch(notificationsLoaded([]));
  }
};

const notificationReducer = notificationSlice.reducer;
export default notificationReducer;
