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

export const fetchNotifications = () => async (dispatch) => {
  dispatch(notificationsLoading());
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      dispatch(notificationsLoaded([]));
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    const api = process.env.REACT_APP_API;

    // Fetch resignation requests (from staff list)
    const staffRes = await axios.get(`${api}/staff/get-all`, { headers }).catch(() => null);
    const staffList = staffRes?.data?.success ? staffRes.data.data : [];
    const pendingResignations = staffList.filter(s => s.resignation?.status === 'pending');

    // Fetch asset requests
    const assetRes = await axios.get(`${api}/assets/requests`, { headers }).catch(() => null);
    const assetRequests = assetRes?.data?.success ? assetRes.data.data : [];
    const pendingAssets = assetRequests.filter(r => r.status === 'pending');

    // Fetch leave requests
    const leaveRes = await axios.get(`${api}/leave/requests?status=pending`, { headers }).catch(() => null);
    const pendingLeaves = leaveRes?.data?.success ? leaveRes.data.data : [];

    // Fetch feedback & complaints
    const feedbacksRes = await axios.get(`${api}/feedback/all`, { headers }).catch(() => null);
    const feedbacks = feedbacksRes?.data?.success ? feedbacksRes.data.data : [];
    const openFeedbacks = feedbacks.filter(f => f.status === 'open');

    // Fetch regularization requests from localStorage
    const storedRegs = JSON.parse(localStorage.getItem('regularization_requests') || '[]');
    const pendingRegs = storedRegs.filter(r => r.status === 'pending');

    const notifications = [];

    // 1. Feedbacks & Complaints
    openFeedbacks.forEach(f => {
      notifications.push({
        id: `feedback-${f._id}`,
        img: f.staff_id?.photo ? `${process.env.REACT_APP_UPLOAD_DIR}${f.staff_id.photo}` : '/img/profile/profile-5.webp',
        detail: `New ${f.type} submitted: "${f.title}" by ${f.staff_id?.f_name || ''} ${f.staff_id?.l_name || ''}.`,
        link: '/feedbacks',
        date: formatDateSafely(f.createdAt),
      });
    });

    // 2. Resignations
    pendingResignations.forEach(r => {
      notifications.push({
        id: `resignation-${r._id}`,
        img: r.photo ? `${process.env.REACT_APP_UPLOAD_DIR}${r.photo}` : '/img/profile/profile-1.webp',
        detail: `${r.f_name} ${r.l_name} submitted a resignation request.`,
        link: '/staff/view',
        date: formatDateSafely(r.resignation?.submitted_on),
      });
    });

    // 2. Asset Requests
    pendingAssets.forEach(r => {
      notifications.push({
        id: `asset-${r._id}`,
        img: r.staff_id?.photo ? `${process.env.REACT_APP_UPLOAD_DIR}${r.staff_id.photo}` : '/img/profile/profile-2.webp',
        detail: `New asset request: "${r.asset_name}" (${r.asset_type}) by ${r.staff_id?.f_name || ''} ${r.staff_id?.l_name || ''}.`,
        link: '/assets',
        date: formatDateSafely(r.createdAt),
      });
    });

    // 3. Leave Requests
    pendingLeaves.forEach(r => {
      notifications.push({
        id: `leave-${r._id}`,
        img: r.staff_id?.photo ? `${process.env.REACT_APP_UPLOAD_DIR}${r.staff_id.photo}` : '/img/profile/profile-3.webp',
        detail: `${r.staff_id?.f_name || 'Staff'} ${r.staff_id?.l_name || ''} requested ${r.leave_type || 'leave'} from ${formatDateSafely(r.from_date)} to ${formatDateSafely(r.to_date)}.`,
        link: '/staff/leave-requests',
        date: formatDateSafely(r.applied_on || r.createdAt),
      });
    });

    // 4. Regularization Requests
    pendingRegs.forEach(r => {
      const match = staffList.find(s => s._id === r.staff_id || s.staff_id === r.staff_id);
      notifications.push({
        id: `reg-${r.id || r._id}`,
        img: match?.photo ? `${process.env.REACT_APP_UPLOAD_DIR}${match.photo}` : '/img/profile/profile-6.webp',
        detail: `${r.staffName || (match ? `${match.f_name} ${match.l_name}` : 'Staff')} requested attendance regularization for ${formatDateSafely(r.date)}.`,
        link: '/attendance',
        date: formatDateSafely(r.date),
      });
    });

    const read = JSON.parse(localStorage.getItem('read_notifications') || '[]');
    const unreadNotifications = notifications.filter(n => !read.includes(n.id));

    dispatch(notificationsLoaded(unreadNotifications));
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    dispatch(notificationsLoaded([]));
  }
};

const notificationReducer = notificationSlice.reducer;
export default notificationReducer;
