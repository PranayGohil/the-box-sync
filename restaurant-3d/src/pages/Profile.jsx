import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AppContext';
import { useRestaurant } from '../context/RestaurantContext';
import { User, LogOut, Mail, History, Heart, MapPin, Trash, ArrowLeft, Plus, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import MenuCard from '../components/MenuCard';
import { motion } from 'framer-motion';

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const { restaurantCode, menu } = useRestaurant();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Address form states
  const [addressVal, setAddressVal] = useState('');
  const [exactLocationVal, setExactLocationVal] = useState('');
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
  const markerInstance = useRef(null);

  const [placeIdVal, setPlaceIdVal] = useState('');
  const [formattedAddressVal, setFormattedAddressVal] = useState('');
  const [postalCodeVal, setPostalCodeVal] = useState('');
  const [localityVal, setLocalityVal] = useState('');
  const [sublocalityVal, setSublocalityVal] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [customTagVal, setCustomTagVal] = useState('');

  const handleOpenEditModal = () => {
    setEditName(user?.name || '');
    setEditPhone(user?.phone || '');
    setShowEditModal(true);
  };

  // Load Google Maps API Script
  useEffect(() => {
    const scriptId = 'google-maps-script-customer';
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY'}&libraries=places,geometry&loading=async`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  // Google Maps picker inline initialization
  useEffect(() => {
    if (!showAddAddressForm || !window.google) return () => { };

    const defaultLat = Number(tempLat) || 23.0225;
    const defaultLng = Number(tempLng) || 72.5714;
    const mapDiv = document.getElementById('map-container');
    if (!mapDiv) return () => { };

    const map = new window.google.maps.Map(mapDiv, {
      center: { lat: defaultLat, lng: defaultLng },
      zoom: 18,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const marker = new window.google.maps.Marker({
      position: { lat: defaultLat, lng: defaultLng },
      map: map,
      draggable: true,
    });

    marker.addListener('dragend', () => {
      const position = marker.getPosition();
      if (position) {
        setTempLat(position.lat());
        setTempLng(position.lng());
      }
    });

    map.addListener('click', (e) => {
      if (e.latLng) {
        marker.setPosition(e.latLng);
        setTempLat(e.latLng.lat());
        setTempLng(e.latLng.lng());
      }
    });

    const input = document.getElementById('map-search-input');
    if (input) {
      const autocomplete = new window.google.maps.places.Autocomplete(input, {
        types: ['geocode', 'establishment'],
      });
      autocomplete.bindTo('bounds', map);
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
          toast.error("No details available for input location.");
          return;
        }

        map.setCenter(place.geometry.location);
        map.setZoom(18);
        marker.setPosition(place.geometry.location);
        setTempLat(place.geometry.location.lat());
        setTempLng(place.geometry.location.lng());

        if (place.formatted_address) {
          setSearchQuery(place.formatted_address);
        }
      });
    }

    mapInstance.current = map;
    markerInstance.current = marker;

    return () => {
      mapInstance.current = null;
      markerInstance.current = null;
    };
  }, [showAddAddressForm]);

  const reverseGeocode = async (lat, lng) => {
    if (!window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat: Number(lat), lng: Number(lng) } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const result = results[0];
        const components = result.address_components;

        const extract = (types) => {
          const found = components.find(c => types.some(t => c.types.includes(t)));
          return found ? found.long_name : "";
        };

        const resolvedPlaceId = result.place_id;
        const resolvedFormattedAddress = result.formatted_address;
        const city = extract(["locality", "administrative_area_level_2"]);
        const state = extract(["administrative_area_level_1"]);
        const postal_code = extract(["postal_code"]);
        const locality = extract(["sublocality_level_1", "neighborhood"]);
        const sublocality = extract(["sublocality_level_2", "sublocality"]);

        setPlaceIdVal(resolvedPlaceId);
        setFormattedAddressVal(resolvedFormattedAddress);
        setAddressVal(resolvedFormattedAddress);
        setCityVal(city);
        setStateVal(state);
        setPincodeVal(postal_code);
        setPostalCodeVal(postal_code);
        setLocalityVal(locality);
        setSublocalityVal(sublocality);

        toast.success('Address auto-resolved successfully!');
      } else {
        toast.error('Reverse geocoding failed: ' + status);
      }
    });
  };

  const handleOpenAddAddressForm = () => {
    if (navigator.geolocation) {
      setDetectingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setTempLat(latitude);
          setTempLng(longitude);
          setLatVal(latitude);
          setLngVal(longitude);
          setDetectingLocation(false);
          // Run geocoding instantly
          reverseGeocode(latitude, longitude);
          setShowAddAddressForm(true);
        },
        (err) => {
          setDetectingLocation(false);
          if (err.code === 1) { // PERMISSION_DENIED
            const manual = window.confirm(
              "Location access is blocked or disabled in your browser settings.\n\n" +
              "To auto-detect:\n" +
              "1. Click the settings/lock icon next to the URL in your address bar.\n" +
              "2. Set Location permissions to 'Allow'.\n" +
              "3. Reload the page.\n\n" +
              "Would you like to manually choose your address on the map instead?"
            );
            if (manual) {
              setTempLat(23.0225);
              setTempLng(72.5714);
              setLatVal(23.0225);
              setLngVal(72.5714);
              setShowAddAddressForm(true);
            }
          } else {
            toast.error('Unable to fetch location automatically.');
            setTempLat(23.0225);
            setTempLng(72.5714);
            setLatVal(23.0225);
            setLngVal(72.5714);
            setShowAddAddressForm(true);
          }
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setTempLat(23.0225);
      setTempLng(72.5714);
      setLatVal(23.0225);
      setLngVal(72.5714);
      setShowAddAddressForm(true);
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
        } catch (err) {
          console.error('Error loading saved items:', err);
        }
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
      } catch (err) {
        console.error('Error syncing saved items:', err);
      }
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
      const res = await fetch(`${API_URL}/web-customer/get-orders/${user._id}?restaurantCode=${restaurantCode}`, {
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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editName || !editPhone) {
      toast.error('Name and Phone Number are required');
      return;
    }
    setUpdatingProfile(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const token = localStorage.getItem('ember-token');
      const res = await fetch(`${API_URL}/web-customer/update/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          phone: editPhone
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Profile updated successfully');
        setShowEditModal(false);
        refreshUser();
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!latVal || !lngVal || !placeIdVal) {
      toast.error('Please confirm your location on the map first!');
      return;
    }
    if (!addressVal || !cityVal || !pincodeVal) {
      toast.error('Street Address, City, and Pincode are required');
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
          exact_location: exactLocationVal,
          city: cityVal,
          state: stateVal || 'State',
          country: 'India',
          pincode: pincodeVal,
          tag: tagVal === 'Other' ? (customTagVal.trim() || 'Other') : tagVal,
          place_id: placeIdVal,
          formatted_address: formattedAddressVal,
          latitude: latVal ? Number(latVal) : undefined,
          longitude: lngVal ? Number(lngVal) : undefined,
          postal_code: postalCodeVal,
          locality: localityVal,
          sublocality: sublocalityVal
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Address added successfully');
        setShowAddAddressForm(false);
        setAddressVal('');
        setExactLocationVal('');
        setCityVal('');
        setStateVal('');
        setPincodeVal('');
        setTagVal('Home');
        setCustomTagVal('');
        setLatVal('');
        setLngVal('');
        setPlaceIdVal('');
        setFormattedAddressVal('');
        setPostalCodeVal('');
        setLocalityVal('');
        setSublocalityVal('');
        refreshUser();
      } else {
        toast.error(data.message || 'Failed to add address');
      }
    } catch (err) {
      console.error('Error adding address:', err);
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
      console.error('Error deleting address:', err);
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
        <div className="glass rounded-4 p-4 p-md-5 d-flex flex-column flex-md-row align-items-center align-items-md-start gap-4 mb-4 position-relative overflow-hidden">
          <div className="position-absolute rounded-circle pointer-events-none" style={{ top: 0, right: 0, width: '250px', height: '250px', background: 'rgba(242, 122, 26, 0.1)', filter: 'blur(100px)' }} />

          <div className="rounded-circle d-flex align-items-center justify-content-center shadow text-white font-display fw-bold text-uppercase flex-shrink-0" style={{ width: '96px', height: '96px', fontSize: '2rem', background: 'linear-gradient(135deg, var(--brand), #e05c0c)' }}>
            {user.name?.charAt(0) || 'G'}
          </div>

          <div className="flex-grow-1 text-center text-md-start">
            <h2 className="font-display fw-bold text-white mb-1 text-capitalize d-flex align-items-center justify-content-center justify-content-md-start gap-2">
              {user.name || 'Guest User'}
              <button
                onClick={handleOpenEditModal}
                className="btn-ghost p-1 rounded hover:text-brand-400 transition-colors border-0 bg-transparent text-white-60"
                style={{ cursor: 'pointer' }}
                title="Edit Details"
              >
                <Edit2 size={16} />
              </button>
            </h2>
            <p className="text-white-60 d-flex flex-column flex-md-row align-items-center justify-content-center justify-content-md-start gap-2 gap-md-4 small mb-3">
              <span className="d-flex align-items-center gap-2"><Mail size={14} /> {user.email}</span>
              {user.phone && <span className="d-flex align-items-center gap-2">📞 {user.phone}</span>}
            </p>
            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill small fw-semibold" style={{ background: 'rgba(242, 122, 26, 0.2)', color: 'var(--brand)', border: '1px solid rgba(242, 122, 26, 0.3)' }}>
              Member since {user.since}
            </div>
          </div>

          <button onClick={handleLogout} className="btn-ghost align-self-center align-self-md-start small py-2 px-3" style={{ zIndex: 10, position: 'relative', cursor: 'pointer' }}>
            <LogOut size={16} className="me-2" /> Logout
          </button>
        </div>

        {/* Complete Profile warning banner */}
        {(!user.name || !user.phone) && (
          <div className="alert bg-warning bg-opacity-10 border border-warning border-opacity-20 text-white rounded-4 p-4 mb-5 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h5 className="fw-bold text-warning mb-1">Complete your profile</h5>
              <p className="small text-white-60 mb-0">Please add your name and phone number to make ordering faster at checkout.</p>
            </div>
            <button onClick={handleOpenEditModal} className="btn-primary py-2 px-4 rounded border-0">
              Complete Profile
            </button>
          </div>
        )}

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
                        'KOT': 'Preparing',
                        'Preparing': 'Preparing Food',
                        'Out for Delivery': 'Out for Delivery',
                        'Delivered': 'Delivered',
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
                          <span className="badge bg-brand-500 px-2 py-0.5 text-white rounded text-uppercase" style={{ fontSize: '9px', fontWeight: 'bold' }}>
                            {addr.tag}
                          </span>
                        )}
                      </div>
                      {addr.exact_location && (
                        <p className="text-brand-400 small mb-1 fw-semibold">{addr.exact_location}</p>
                      )}
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
            {showAddAddressForm ? (
              <div className="glass rounded-4 p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="text-white mb-0 d-flex align-items-center gap-2">
                    <Plus size={18} className="text-brand-400" /> Add New Address
                  </h5>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddAddressForm(false);
                      setAddressVal('');
                      setExactLocationVal('');
                      setCityVal('');
                      setStateVal('');
                      setPincodeVal('');
                      setLatVal('');
                      setLngVal('');
                      setTempLat('');
                      setTempLng('');
                    }}
                    className="btn bg-transparent border-0 text-white-60 hover:text-white fw-bold py-1 px-2"
                  >
                    Cancel
                  </button>
                </div>

                {/* Geocoding Search Input Inline at Top */}
                <div className="mb-3">
                  <label className="form-label small text-white-60 mb-2">Search Location on Map (Mandatory)</label>
                  <form onSubmit={(e) => e.preventDefault()} className="d-flex gap-2 mb-2">
                    <input
                      type="text"
                      id="map-search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input-field flex-grow-1 py-2.5 px-3 small text-white"
                      placeholder="Type area, street name to search on map..."
                    />
                  </form>
                </div>

                {/* Map Container Inline */}
                <div
                  id="map-container"
                  className="rounded-3 mb-3 border border-white-10"
                  style={{ height: '350px', background: '#1A1A1A' }}
                />

                {/* Locate Me & Confirm buttons inside form */}
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                  <div className="small font-monospace text-brand-400">
                    {latVal && lngVal ? (
                      <span>Confirmed Pin: {Number(latVal).toFixed(5)}, {Number(lngVal).toFixed(5)}</span>
                    ) : tempLat && tempLng ? (
                      <span className="text-warning">Temp Pin placed (Click Confirm Location)</span>
                    ) : (
                      <span className="text-white-40 italic">Move pin or search address</span>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      disabled={locatingUser}
                      onClick={() => {
                        if (navigator.geolocation) {
                          setLocatingUser(true);
                          navigator.geolocation.getCurrentPosition(
                            (pos) => {
                              const { latitude, longitude } = pos.coords;
                              setTempLat(latitude);
                              setTempLng(longitude);
                              if (mapInstance.current && window.google) {
                                const latlng = new window.google.maps.LatLng(latitude, longitude);
                                mapInstance.current.setCenter(latlng);
                                mapInstance.current.setZoom(18);
                                if (markerInstance.current) {
                                  markerInstance.current.setPosition(latlng);
                                }
                              }
                              setLocatingUser(false);
                            },
                            (err) => {
                              setLocatingUser(false);
                              if (err.code === 1) {
                                alert(
                                  "Location access is blocked or disabled in your browser settings.\n\n" +
                                  "To enable:\n" +
                                  "1. Click the settings/lock icon next to the URL in your address bar.\n" +
                                  "2. Set Location permissions to 'Allow'.\n" +
                                  "3. Refresh the page.\n\n" +
                                  "Alternatively, you can manually drag the pin marker on the map to select your address."
                                );
                              } else {
                                toast.error('Unable to fetch your location automatically.');
                              }
                            }
                          );
                        } else {
                          toast.error('Geolocation is not supported by your browser.');
                        }
                      }}
                      className="btn-ghost py-2 px-3 small border-white-10 rounded d-flex align-items-center gap-2"
                      style={{ fontSize: '12px' }}
                    >
                      {locatingUser ? (
                        <>
                          <span className="spinner-border spinner-border-sm text-brand-400" role="status" style={{ width: '12px', height: '12px' }} />
                          Locating...
                        </>
                      ) : (
                        'Locate Me'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (tempLat && tempLng) {
                          setLatVal(tempLat);
                          setLngVal(tempLng);
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

                <hr style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '1.5rem 0' }} />

                {/* Sub-inputs form block */}
                <form onSubmit={handleAddAddress} className="row g-3">
                  <div className="col-12">
                    <label className="form-label small text-white-60 mb-1">Street Address (Mandatory)</label>
                    <input
                      type="text"
                      value={addressVal}
                      onChange={(e) => setAddressVal(e.target.value)}
                      className="input-field w-100"
                      placeholder="Select and Confirm location on map to populate automatically"
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small text-white-60 mb-1">Exact Location (Flat/House/Floor No., Landmark, etc.) (Mandatory)</label>
                    <input
                      type="text"
                      value={exactLocationVal}
                      onChange={(e) => setExactLocationVal(e.target.value)}
                      className="input-field w-100"
                      placeholder="e.g. Flat 4B, 3rd Floor, Near Central Mall"
                      required
                    />
                  </div>
                  <div className="col-12 col-sm-4">
                    <label className="form-label small text-white-60 mb-1">City (Mandatory)</label>
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
                    <label className="form-label small text-white-60 mb-1">State (Mandatory)</label>
                    <input
                      type="text"
                      value={stateVal}
                      onChange={(e) => setStateVal(e.target.value)}
                      className="input-field w-100"
                      placeholder="State"
                      required
                    />
                  </div>
                  <div className="col-12 col-sm-4">
                    <label className="form-label small text-white-60 mb-1">Pincode (Mandatory)</label>
                    <input
                      type="text"
                      value={pincodeVal}
                      onChange={(e) => setPincodeVal(e.target.value)}
                      className="input-field w-100"
                      placeholder="Pincode"
                      required
                    />
                  </div>

                  {/* Tag Selector */}
                  <div className="col-12 mt-3">
                    <label className="form-label small text-white-60 mb-2 d-block">Save Address As</label>
                    <div className="d-flex gap-2 mb-3">
                      {['Home', 'Work', 'Other'].map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setTagVal(tag)}
                          className={`px-4 py-2 rounded-pill small fw-semibold transition-all ${tagVal === tag
                            ? 'bg-brand-500 text-white border-0'
                            : 'glass border border-white-10 text-white-60 hover:text-white'
                            }`}
                          style={{ minWidth: '80px' }}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    {tagVal === 'Other' && (
                      <div className="animate-fade-in">
                        <label className="form-label small text-white-60 mb-1">Custom Tag Name (e.g. Friend's House, Gym) (Mandatory)</label>
                        <input
                          type="text"
                          value={customTagVal}
                          onChange={(e) => setCustomTagVal(e.target.value)}
                          className="input-field w-100"
                          placeholder="Enter custom tag..."
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div className="col-12 mt-4">
                    <button type="submit" className="btn-primary py-2.5 px-4 font-semibold shadow w-100 justify-content-center">
                      Save Address
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="d-flex justify-content-center mt-3">
                <button
                  type="button"
                  onClick={handleOpenAddAddressForm}
                  className="btn-primary d-flex align-items-center gap-2 py-3 px-5 fw-bold"
                >
                  <Plus size={20} /> Add Address
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {detectingLocation && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center px-3"
          style={{
            zIndex: 3000,
            background: 'rgba(6,6,6,0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
        >
          <div className="spinner-border text-brand-400 mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-white font-display fw-bold mb-1">Detecting Your Location</h5>
          <p className="small text-white-60">Please allow location access if prompted.</p>
        </div>
      )}

      {showEditModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3"
          style={{
            zIndex: 2000,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-4 p-4 p-md-5 w-100 position-relative animate-fade-in"
            style={{ maxWidth: '500px', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="font-display fw-bold text-white mb-0">Edit Personal Details</h4>
              <button
                onClick={() => setShowEditModal(false)}
                className="btn bg-transparent text-white-60 hover:text-white border-0 p-1 font-bold"
                style={{ fontSize: '1.25rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="d-flex flex-column gap-4">
              <div>
                <label className="form-label small text-white-60 mb-2 fw-medium">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-field w-100 py-3 px-3 text-white"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="form-label small text-white-60 mb-2 fw-medium">Phone Number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="input-field w-100 py-3 px-3 text-white"
                  placeholder="9876543210"
                  required
                />
              </div>

              <div className="d-flex gap-2 justify-content-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn bg-transparent border-0 text-white-60 hover:text-white py-2 px-4 rounded"
                  disabled={updatingProfile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2 px-4 rounded"
                  disabled={updatingProfile}
                >
                  {updatingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </main>
  );
}
