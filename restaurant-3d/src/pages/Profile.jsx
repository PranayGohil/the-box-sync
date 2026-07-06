import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AppContext';
import { useRestaurant } from '../context/RestaurantContext';
import { User, LogOut, Mail, History, Heart, MapPin, Trash, ArrowLeft, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import MenuCard from '../components/MenuCard';

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const { restaurantCode, menu } = useRestaurant();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Address form states
  const [addressVal, setAddressVal] = useState('');
  const [cityVal, setCityVal] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [pincodeVal, setPincodeVal] = useState('');
  const [tagVal, setTagVal] = useState('Home');
  const [latVal, setLatVal] = useState('');
  const [lngVal, setLngVal] = useState('');
  const [tempLat, setTempLat] = useState('');
  const [tempLng, setTempLng] = useState('');
  const [showMapModal, setShowMapModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const mapInstance = useRef(null);

  // Dynamic Map Picker Script & Leaflet initialization loader
  useEffect(() => {
    if (!showMapModal) return;

    // Load Leaflet css
    let leafletCss = document.getElementById('leaflet-css');
    if (!leafletCss) {
      leafletCss = document.createElement('link');
      leafletCss.id = 'leaflet-css';
      leafletCss.rel = 'stylesheet';
      leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(leafletCss);
    }

    // Load Leaflet js
    let leafletJs = document.getElementById('leaflet-js');
    if (!leafletJs) {
      leafletJs = document.createElement('script');
      leafletJs.id = 'leaflet-js';
      leafletJs.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      document.head.appendChild(leafletJs);
    }

    let activeMarker = null;

    const initMap = () => {
      if (!window.L || !document.getElementById('map-container')) return;

      const defaultLat = latVal || 23.0225;
      const defaultLng = lngVal || 72.5714;

      const map = window.L.map('map-container').setView([defaultLat, defaultLng], 14);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Create or position marker
      if (latVal && lngVal) {
        activeMarker = window.L.marker([latVal, lngVal]).addTo(map);
      }

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        if (activeMarker) {
          activeMarker.setLatLng(e.latlng);
        } else {
          activeMarker = window.L.marker(e.latlng).addTo(map);
        }
        setTempLat(lat);
        setTempLng(lng);
      });

      mapInstance.current = map;
    };

    if (window.L) {
      setTimeout(initMap, 150);
    } else {
      leafletJs.onload = () => setTimeout(initMap, 150);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [showMapModal]);

  const handleSearchLocation = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || !mapInstance.current) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const numLat = Number(lat);
        const numLon = Number(lon);
        mapInstance.current.setView([numLat, numLon], 15);
        setTempLat(numLat);
        setTempLng(numLon);

        // Add marker if not already present
        if (window.L) {
          const map = mapInstance.current;
          // Clear previous layers that are markers if needed or let Leaflet handle
          const latlng = [numLat, numLon];
          // We can trigger click/marker logic
          map.fireEvent('click', { latlng: window.L.latLng(numLat, numLon) });
        }
        toast.success('Location found on map!');
      } else {
        toast.error('Location not found. Please try a different query.');
      }
    } catch (err) {
      toast.error('Search failed.');
    }
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.address) {
        const road = data.address.road || data.address.suburb || data.address.neighbourhood || '';
        const house = data.address.house_number || '';
        setAddressVal([house, road, data.address.amenity || ''].filter(Boolean).join(' ') || data.display_name);
        setCityVal(data.address.city || data.address.town || data.address.village || '');
        setStateVal(data.address.state || '');
        setPincodeVal(data.address.postcode || '');
        toast.success('Address details auto-filled!');
      }
    } catch (err) {
      console.error('Error reverse geocoding', err);
    }
  };

  // Local storage saved item ids
  const [savedItemIds, setSavedItemIds] = useState([]);

  // Flatten and format menu dishes to match MenuCard structure
  const allDishes = useMemo(() => {
    if (!menu) return [];
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    return menu.flatMap(catDoc =>
      catDoc.dishes.map(dish => {
        let dietType = 'veg';
        const rawMealType = dish.meal_type?.toLowerCase();
        if (rawMealType === 'non-veg' || rawMealType === 'nonveg') {
          dietType = 'nonveg';
        } else if (rawMealType === 'egg') {
          dietType = 'egg';
        } else if (rawMealType === 'veg') {
          dietType = 'veg';
        } else {
          // Safe fallback for old records
          const catName = catDoc.category.toLowerCase();
          const dishName = dish.dish_name.toLowerCase();
          if (catName.includes('non-veg') || catName.includes('non veg') || dishName.includes('chicken') || dishName.includes('mutton') || dishName.includes('fish') || dishName.includes('prawn')) {
            dietType = 'nonveg';
          } else if (catName.includes('egg')) {
            dietType = 'egg';
          }
        }

        const rawImg = dish.dish_img;
        const imageUrl = rawImg
          ? (rawImg.startsWith('http') || rawImg.includes('/uploads/') ? rawImg : `${API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL}/uploads/${rawImg.replace(/^\/+/, '')}`)
          : null;

        return {
          id: dish._id,
          name: dish.dish_name,
          price: dish.dish_price || 0,
          description: dish.description,
          image: imageUrl,
          category: catDoc.category,
          dietType,
          rating: 4.5,
          reviews: 0
        };
      })
    );
  }, [menu]);

  // Load saved item ids from local storage
  useEffect(() => {
    if (user?._id) {
      const loadSaved = () => {
        try {
          const saved = localStorage.getItem(`ember-saved-${user._id}`);
          setSavedItemIds(saved ? JSON.parse(saved) : []);
        } catch (err) { }
      };
      loadSaved();
      window.addEventListener('storage', loadSaved);
      return () => window.removeEventListener('storage', loadSaved);
    }
    return undefined;
  }, [user]);

  // Sync saved item ids when saved tab is selected
  useEffect(() => {
    if (activeTab === 'saved' && user?._id) {
      try {
        const saved = localStorage.getItem(`ember-saved-${user._id}`);
        setSavedItemIds(saved ? JSON.parse(saved) : []);
      } catch (err) { }
    }
  }, [activeTab, user]);

  const savedDishes = useMemo(() => {
    return allDishes.filter(dish => savedItemIds.includes(dish.id));
  }, [allDishes, savedItemIds]);

  // Reusable function to fetch orders
  const fetchOrders = async () => {
    if (!user?._id) return;
    setLoadingOrders(true);
    try {
      const token = localStorage.getItem('ember-token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const res = await fetch(`${API_URL}/web-customer/get-orders/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const rawOrders = data.data || [];
        const sorted = [...rawOrders].sort((a, b) => {
          const dateA = a.order_date?.$date || a.order_date || a.createdAt || 0;
          const dateB = b.order_date?.$date || b.order_date || b.createdAt || 0;
          return new Date(dateB) - new Date(dateA);
        });
        setOrders(sorted);
      }
    } catch (e) {
      console.error('Failed to load orders', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch orders when orders tab becomes active
  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, user]);

  const { socket } = useSocket();

  // Realtime order tracking using Socket.io room subscription
  useEffect(() => {
    if (!socket) return () => { };

    const handleOrderUpdate = () => {
      console.log('Realtime order update received via SocketContext: fetching orders...');
      fetchOrders();
    };

    socket.on('order_updated', handleOrderUpdate);
    socket.on('kot_update', handleOrderUpdate);

    return () => {
      socket.off('order_updated', handleOrderUpdate);
      socket.off('kot_update', handleOrderUpdate);
    };
  }, [socket]);

  const handleLogout = () => {
    logout();
    navigate(`/${restaurantCode}`);
    toast('Logged out', {
      icon: '👋',
      style: { background: '#1A1A1A', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }
    });
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!addressVal || !cityVal || !pincodeVal) {
      toast.error('Address line, City, and Pincode are required');
      return;
    }
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const token = localStorage.getItem('ember-token');
      const res = await fetch(`${API_URL}/web-customer/add-address/${user._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          address: addressVal,
          city: cityVal,
          state: stateVal || 'State',
          country: 'India',
          pincode: pincodeVal,
          tag: tagVal,
          latitude: latVal || undefined,
          longitude: lngVal || undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Address added successfully');
        setAddressVal('');
        setCityVal('');
        setStateVal('');
        setPincodeVal('');
        setTagVal('Home');
        setLatVal('');
        setLngVal('');
        refreshUser();
      } else {
        toast.error(data.message || 'Failed to add address');
      }
    } catch (err) {
      toast.error('Error adding address');
    }
  };

  const handleDeleteAddress = async (addrId) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const token = localStorage.getItem('ember-token');
      const res = await fetch(`${API_URL}/web-customer/delete-address/${user._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ addressId: addrId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Address deleted successfully');
        refreshUser();
      } else {
        toast.error(data.message || 'Failed to delete address');
      }
    } catch (err) {
      toast.error('Error deleting address');
    }
  };

  if (!user) {
    return (
      <main className="min-vh-100 d-flex flex-column align-items-center justify-content-center px-3" style={{ paddingTop: '8rem', paddingBottom: '8rem' }}>
        <div className="text-center glass p-5 rounded-4" style={{ maxWidth: '400px' }}>
          <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4 shadow" style={{ width: '80px', height: '80px', background: 'rgba(242, 122, 26, 0.1)', border: '1px solid rgba(242, 122, 26, 0.2)' }}>
            <User size={40} className="text-brand-400" />
          </div>
          <h2 className="text-white fw-bold mb-3">Sign In Required</h2>
          <p className="text-white-60 mb-4">Please sign in to access your profile, order history, and rewards.</p>
          <button
            onClick={() => navigate(`/${restaurantCode}/login`.replace(/\/+/g, '/'))}
            className="btn-primary w-100 justify-content-center py-2"
          >
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-vh-100" style={{ paddingTop: '8rem', paddingBottom: '8rem' }}>
      <div className="container-lg" style={{ maxWidth: '900px' }}>
        {/* Profile Header */}
        <div className="glass rounded-4 p-4 p-md-5 d-flex flex-column flex-md-row align-items-center align-items-md-start gap-4 mb-5 position-relative overflow-hidden">
          <div className="position-absolute rounded-circle pointer-events-none" style={{ top: 0, right: 0, width: '250px', height: '250px', background: 'rgba(242, 122, 26, 0.1)', filter: 'blur(100px)' }} />

          <div className="rounded-circle d-flex align-items-center justify-content-center shadow text-white font-display fw-bold text-uppercase flex-shrink-0" style={{ width: '96px', height: '96px', fontSize: '2rem', background: 'linear-gradient(135deg, var(--brand), #e05c0c)' }}>
            {user.name?.charAt(0) || 'U'}
          </div>

          <div className="flex-grow-1 text-center text-md-start">
            <h2 className="font-display fw-bold text-white mb-1 text-capitalize">{user.name}</h2>
            <p className="text-white-60 d-flex align-items-center justify-content-center justify-content-md-start gap-2 small mb-3">
              <Mail size={14} /> {user.email}
            </p>
            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill small fw-semibold" style={{ background: 'rgba(242, 122, 26, 0.2)', color: 'var(--brand)', border: '1px solid rgba(242, 122, 26, 0.3)' }}>
              Member since {user.since}
            </div>
          </div>

          <button onClick={handleLogout} className="btn-ghost align-self-center align-self-md-start small py-2 px-3" style={{ zIndex: 10, position: 'relative', cursor: 'pointer' }}>
            <LogOut size={16} className="me-2" /> Logout
          </button>
        </div>

        {/* Dynamic Panels */}
        {activeTab === 'dashboard' && (
          <div className="row g-4">
            <div className="col-12 col-md-4" onClick={() => setActiveTab('orders')}>
              <div className="glass rounded-4 p-4 transition-colors h-100 position-relative" style={{ cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(242, 122, 26, 0.3)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}>
                <div className="rounded-3 d-flex align-items-center justify-content-center mb-3" style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)' }}>
                  <History size={20} className="text-brand-400" />
                </div>
                <h5 className="fw-semibold text-white mb-2">Order History</h5>
                <p className="small text-white-60 mb-0">View your past orders and receipts.</p>
              </div>
            </div>

            <div className="col-12 col-md-4" onClick={() => setActiveTab('saved')}>
              <div className="glass rounded-4 p-4 transition-colors h-100 position-relative" style={{ cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(242, 122, 26, 0.3)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}>
                <div className="rounded-3 d-flex align-items-center justify-content-center mb-3" style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)' }}>
                  <Heart size={20} className="text-brand-400" />
                </div>
                <h5 className="fw-semibold text-white mb-2">Saved Items</h5>
                <p className="small text-white-60 mb-0">Your favourite dishes saved for later.</p>
              </div>
            </div>

            <div className="col-12 col-md-4" onClick={() => setActiveTab('addresses')}>
              <div className="glass rounded-4 p-4 transition-colors h-100 position-relative" style={{ cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(242, 122, 26, 0.3)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}>
                <div className="rounded-3 d-flex align-items-center justify-content-center mb-3" style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)' }}>
                  <MapPin size={20} className="text-brand-400" />
                </div>
                <h5 className="fw-semibold text-white mb-2">Addresses</h5>
                <p className="small text-white-60 mb-0">Manage your delivery locations.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── ORDER HISTORY SUBPANEL ── */}
        {activeTab === 'orders' && (
          <div>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="btn-ghost d-flex align-items-center gap-2 mb-4 text-white-60 hover:text-white transition-colors border-0 bg-transparent"
            >
              <ArrowLeft size={18} /> Back to Dashboard
            </button>

            <h3 className="font-display fw-bold text-white mb-4">Past Orders</h3>

            {loadingOrders ? (
              <div className="text-center py-5">
                <div className="spinner-border text-brand-400" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="glass p-5 rounded-4 text-center">
                <History size={40} className="text-white-60 mb-3 mx-auto" />
                <p className="text-white-60 mb-0">You haven't placed any orders yet.</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order._id} className="glass rounded-4 p-4 mb-3 border border-white-10">
                  <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
                    <div>
                      <span className="text-white-60 small">Order ID:</span> <span className="font-monospace text-white fw-semibold">#{order._id.substring(18).toUpperCase()}</span>
                    </div>
                    <span className={`badge px-3 py-1.5 rounded-pill small ${{
                      'Requested': 'bg-warning text-dark',
                      'KOT': 'bg-info text-dark',
                      'Preparing': 'bg-info text-dark',
                      'Out for Delivery': 'bg-primary text-white',
                      'Delivered': 'bg-success text-white',
                      'Served': 'bg-success text-white',
                      'Paid': 'bg-success text-white',
                      'Cancelled': 'bg-danger text-white',
                      'Rejected': 'bg-danger text-white'
                    }[order.order_status] || 'bg-secondary text-white'}`}>
                      {{
                        'Requested': 'Pending Approval',
                        'KOT': 'Order Approved (KOT)',
                        'Preparing': 'Preparing Food',
                        'Out for Delivery': 'Out for Delivery 🚴',
                        'Delivered': 'Delivered 🍔',
                        'Served': 'Ready / Served',
                        'Paid': 'Completed & Paid',
                        'Cancelled': 'Cancelled',
                        'Rejected': 'Rejected'
                      }[order.order_status] || order.order_status}
                    </span>
                  </div>
                  <div className="text-white-60 small mb-3">
                    Placed: {(() => {
                      const dateVal = order.order_date?.$date || order.order_date || order.createdAt || order.updated_at?.$date || order.updated_at;
                      const parsed = new Date(dateVal);
                      return isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                    })()}
                  </div>
                  <div className="border-top border-white-10 pt-3">
                    {order.order_items.map((item, idx) => (
                      <div key={idx} className="d-flex justify-content-between align-items-center mb-1 text-white-60 small">
                        <span>{item.dish_name} <strong className="text-brand-400">x{item.quantity}</strong></span>
                        <span>₹{(item.dish_price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-top border-white-10 pt-3 mt-3 d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div>
                      <span className="fw-semibold text-white me-2">Bill Total</span>
                      <span className="text-brand-400 fw-bold fs-5">₹{(order.total_amount || order.bill_amount || 0).toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => navigate(`/${restaurantCode}/order/${order._id}`)}
                      className="btn-ghost px-3 py-1.5 small d-flex align-items-center gap-1.5"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── SAVED ITEMS SUBPANEL ── */}
        {activeTab === 'saved' && (
          <div>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="btn-ghost d-flex align-items-center gap-2 mb-4 text-white-60 hover:text-white transition-colors border-0 bg-transparent"
            >
              <ArrowLeft size={18} /> Back to Dashboard
            </button>

            <h3 className="font-display fw-bold text-white mb-4">Saved Items</h3>

            {savedDishes.length === 0 ? (
              <div className="glass p-5 rounded-4 text-center">
                <Heart size={40} className="text-white-60 mb-3 mx-auto" style={{ fill: 'none' }} />
                <p className="text-white-60 mb-0">No saved items found. Browse our menu to add favorites!</p>
              </div>
            ) : (
              <div className="row g-4">
                {savedDishes.map((dish) => (
                  <div key={dish.id} className="col-12 col-sm-6 col-md-4">
                    <MenuCard item={dish} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ADDRESSES SUBPANEL ── */}
        {activeTab === 'addresses' && (
          <div>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="btn-ghost d-flex align-items-center gap-2 mb-4 text-white-60 hover:text-white transition-colors border-0 bg-transparent"
            >
              <ArrowLeft size={18} /> Back to Dashboard
            </button>

            <h3 className="font-display fw-bold text-white mb-4">Manage Addresses</h3>

            {/* List saved addresses */}
            <div className="mb-5">
              <h5 className="text-white mb-3 small fw-semibold text-uppercase tracking-wider">Saved Addresses</h5>
              {(!user.addresses || user.addresses.length === 0) ? (
                <p className="text-white-60 small">No addresses saved yet. Add one below.</p>
              ) : (
                user.addresses.map((addr) => (
                  <div key={addr._id} className="d-flex justify-content-between align-items-center glass p-3 rounded-4 mb-2 border border-white-10">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <p className="text-white mb-0 fw-medium">{addr.address}</p>
                        {addr.tag && (
                          <span className="badge bg-brand-400 px-2 py-0.5 text-white rounded text-uppercase" style={{ fontSize: '9px', fontWeight: 'bold' }}>
                            {addr.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-white-60 small mb-0">{addr.city}, {addr.state}, {addr.pincode}</p>
                      {addr.latitude && addr.longitude && (
                        <p className="text-white-40 small mb-0 font-monospace" style={{ fontSize: '10px' }}>
                          Location: {Number(addr.latitude).toFixed(5)}, {Number(addr.longitude).toFixed(5)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteAddress(addr._id)}
                      className="btn bg-transparent p-2 text-danger hover:text-white border-0"
                      title="Delete Address"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add new address Form */}
            <div className="glass rounded-4 p-4">
              <h5 className="text-white mb-4 d-flex align-items-center gap-2">
                <Plus size={18} className="text-brand-400" /> Add New Address
              </h5>
              <form onSubmit={handleAddAddress} className="row g-3">
                <div className="col-12">
                  <label className="form-label small text-white-60 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={addressVal}
                    onChange={(e) => setAddressVal(e.target.value)}
                    className="input-field w-100"
                    placeholder="123 Street Name, Apartment..."
                    required
                  />
                </div>
                <div className="col-12 col-sm-4">
                  <label className="form-label small text-white-60 mb-1">City</label>
                  <input
                    type="text"
                    value={cityVal}
                    onChange={(e) => setCityVal(e.target.value)}
                    className="input-field w-100"
                    placeholder="City"
                    required
                  />
                </div>
                <div className="col-12 col-sm-4">
                  <label className="form-label small text-white-60 mb-1">State</label>
                  <input
                    type="text"
                    value={stateVal}
                    onChange={(e) => setStateVal(e.target.value)}
                    className="input-field w-100"
                    placeholder="State"
                  />
                </div>
                <div className="col-12 col-sm-4">
                  <label className="form-label small text-white-60 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={pincodeVal}
                    onChange={(e) => setPincodeVal(e.target.value)}
                    className="input-field w-100"
                    placeholder="Pincode"
                    required
                  />
                </div>

                {/* Zomato/Swiggy-style Tag Selector */}
                <div className="col-12 col-md-6 mt-3">
                  <label className="form-label small text-white-60 mb-2 d-block">Save Address As</label>
                  <div className="d-flex gap-2">
                    {['Home', 'Work', 'Other'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setTagVal(tag)}
                        className={`px-4 py-2 rounded-pill small fw-semibold transition-all ${tagVal === tag
                            ? 'bg-brand-400 text-white border-0'
                            : 'glass border border-white-10 text-white-60 hover:text-white'
                          }`}
                        style={{ minWidth: '80px' }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Map coordinates picker trigger */}
                <div className="col-12 col-md-6 mt-3 d-flex flex-column justify-content-end">
                  <label className="form-label small text-white-60 mb-2">Location Pin (Optional)</label>
                  <div className="d-flex align-items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setTempLat(latVal || 23.0225);
                        setTempLng(lngVal || 72.5714);
                        setShowMapModal(true);
                      }}
                      className="btn-ghost px-4 py-2.5 small d-flex align-items-center gap-1.5 border border-white-10 rounded-pill"
                    >
                      <MapPin size={14} className="text-brand-400" /> Choose on Map
                    </button>
                    {latVal && lngVal ? (
                      <span className="small text-brand-400 font-monospace">
                        Pin Selected ({Number(latVal).toFixed(4)}, {Number(lngVal).toFixed(4)})
                      </span>
                    ) : (
                      <span className="small text-white-40 italic">No pin placed</span>
                    )}
                  </div>
                </div>

                <div className="col-12 mt-4">
                  <button type="submit" className="btn-primary py-2.5 px-4 font-semibold shadow">
                    Save Address
                  </button>
                </div>
              </form>
            </div>

            {/* Map Picker Modal */}
            {showMapModal && (
              <div
                className="position-fixed d-flex align-items-center justify-content-center"
                style={{
                  zIndex: 9999,
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(5px)',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0
                }}
              >
                <div className="glass rounded-4 p-4 w-100 max-w-lg mx-3 border border-white-15 shadow-2xl position-relative" style={{ maxWidth: '600px' }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="text-white fw-bold mb-0">Select Delivery Pin Location</h5>
                    <button
                      onClick={() => setShowMapModal(false)}
                      className="btn bg-transparent text-white-60 hover:text-white border-0 p-1"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Geocoding Search Input */}
                  <form onSubmit={handleSearchLocation} className="d-flex gap-2 mb-3">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input-field flex-grow-1 py-2 px-3 small"
                      placeholder="Search locality, street name..."
                    />
                    <button type="submit" className="btn-primary py-2 px-3 small">
                      Search
                    </button>
                  </form>

                  {/* Map Container */}
                  <div
                    id="map-container"
                    className="rounded-3 mb-3 border border-white-10"
                    style={{ height: '320px', background: '#1A1A1A' }}
                  />

                  {/* Info & Geolocation detector */}
                  <div className="d-flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-center gap-3">
                    <div>
                      {tempLat && tempLng ? (
                        <div className="small font-monospace text-brand-400">
                          Selected: {Number(tempLat).toFixed(5)}, {Number(tempLng).toFixed(5)}
                        </div>
                      ) : (
                        <div className="small text-white-40 italic">Click on map to place pin</div>
                      )}
                    </div>
                    <div className="d-flex gap-2 w-100 sm:w-auto justify-content-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (pos) => {
                                const { latitude, longitude } = pos.coords;
                                setTempLat(latitude);
                                setTempLng(longitude);
                                if (mapInstance.current) {
                                  mapInstance.current.setView([latitude, longitude], 15);
                                  if (window.L) {
                                    mapInstance.current.fireEvent('click', { latlng: window.L.latLng(latitude, longitude) });
                                  }
                                }
                              },
                              (err) => toast.error('Error fetching geolocation permissions')
                            );
                          } else {
                            toast.error('Geolocation is not supported by your browser.');
                          }
                        }}
                        className="btn-ghost py-2 px-3 small border-white-10 rounded"
                        style={{ fontSize: '12px' }}
                      >
                        Locate Me
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (tempLat && tempLng) {
                            setLatVal(tempLat);
                            setLngVal(tempLng);
                            setShowMapModal(false);
                            reverseGeocode(tempLat, tempLng);
                          } else {
                            toast.error('Please select a pin location on the map');
                          }
                        }}
                        className="btn-primary py-2 px-4 small rounded"
                        style={{ fontSize: '12px' }}
                      >
                        Confirm Location
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
