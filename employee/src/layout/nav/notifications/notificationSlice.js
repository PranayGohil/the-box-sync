import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const formatDateSafely = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString('en-IN');
  }
  const parts = String(dateStr).split(/[-/]/);
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const parsedDate = new Date(year, month, day);
      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString('en-IN');
      }
    } else if (parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const parsedDate = new Date(year, month, day);
      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString('en-IN');
      }
    }
  }
  return String(dateStr);
};

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
    dismissNotification(state, action) {
      const id = action.payload;
      state.items = state.items.filter(item => item.id !== id);
      const read = JSON.parse(localStorage.getItem('read_notifications') || '[]');
      if (!read.includes(id)) {
        read.push(id);
        localStorage.setItem('read_notifications', JSON.stringify(read));
      }
    }
  },
});

export const { notificationsLoading, notificationsLoaded, dismissNotification } = notificationSlice.actions;

export const fetchNotifications = () => async (dispatch, getState) => {
  dispatch(notificationsLoading());
  try {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const currentUser = getState().auth?.currentUser;
    
    if (!token || !currentUser) {
      dispatch(notificationsLoaded([]));
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    const api = process.env.REACT_APP_API;

    const [profileRes, leaveRes, assetRes] = await Promise.all([
      axios.get(`${api}/staff/get/${currentUser._id}`, { headers }).catch(() => null),
      axios.get(`${api}/leave/requests`, { headers }).catch(() => null),
      axios.get(`${api}/assets/requests`, { headers }).catch(() => null),
    ]);

    const profile = profileRes?.data?.success ? profileRes.data.data : null;
    const leaveRequests = leaveRes?.data?.success ? leaveRes.data.data : [];
    const assetRequests = assetRes?.data?.success ? assetRes.data.data : [];

    const storedRegs = JSON.parse(localStorage.getItem('regularization_requests') || '[]');
    const myRegs = storedRegs; 

    const notifications = [];

    leaveRequests.forEach(req => {
      if (req.status === 'approved' || req.status === 'rejected') {
        notifications.push({
          id: `leave-${req._id}-${req.status}`,
          img: '/img/profile/profile-3.webp',
          detail: `Your leave request from ${formatDateSafely(req.from_date)} to ${formatDateSafely(req.to_date)} has been ${req.status.toUpperCase()}.`,
          link: '#/',
          date: formatDateSafely(req.approved_on || req.updatedAt),
        });
      }
    });

    if (profile?.resignation && (profile.resignation.status === 'approved' || profile.resignation.status === 'rejected')) {
      notifications.push({
        id: `resignation-${profile._id}-${profile.resignation.status}`,
        img: '/img/profile/profile-1.webp',
        detail: `Your resignation request has been ${profile.resignation.status.toUpperCase()}.${profile.resignation.last_working_day ? ` Last working day: ${formatDateSafely(profile.resignation.last_working_day)}` : ''}`,
        link: '#/',
        date: formatDateSafely(profile.resignation.last_working_day),
      });
    }

    assetRequests.forEach(req => {
      if (req.status === 'approved' || req.status === 'rejected') {
        notifications.push({
          id: `asset-${req._id}-${req.status}`,
          img: '/img/profile/profile-2.webp',
          detail: `Your asset request for "${req.asset_name}" has been ${req.status.toUpperCase()}.`,
          link: '#/',
          date: formatDateSafely(req.updatedAt),
        });
      }
    });

    myRegs.forEach(req => {
      if (req.status === 'Approved' || req.status === 'Rejected') {
        notifications.push({
          id: `reg-${req.id || req._id}-${req.status}`,
          img: '/img/profile/profile-6.webp',
          detail: `Your attendance regularization request for ${formatDateSafely(req.date)} has been ${req.status.toUpperCase()}.`,
          link: '#/',
          date: formatDateSafely(req.date),
        });
      }
    });

    const read = JSON.parse(localStorage.getItem('read_notifications') || '[]');
    const unreadNotifications = notifications.filter(n => !read.includes(n.id));

    dispatch(notificationsLoaded(unreadNotifications));
  } catch (error) {
    console.error('Error fetching employee notifications:', error);
    dispatch(notificationsLoaded([]));
  }
};

const notificationReducer = notificationSlice.reducer;
export default notificationReducer;
