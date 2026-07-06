import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, Smartphone, Banknote, ChevronRight, UtensilsCrossed } from 'lucide-react';
import { useCart, useAuth } from '../context/AppContext';
import { useRestaurant } from '../context/RestaurantContext';
import { useGSAPReveal } from '../hooks/useScroll';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit / Debit Card', Icon: CreditCard },
  { id: 'upi', label: 'UPI / Google Pay', Icon: Smartphone },
  { id: 'cod', label: 'Cash on Delivery', Icon: Banknote },
];

function Field({ label, id, error, ...props }) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label small text-white-60 mb-1">{label}</label>
      <input id={id} className={`input-field w-100 ${error ? 'border-danger' : ''}`} {...props} />
      {error && <p className="small text-danger mt-1 mb-0">{error.message}</p>}
    </div>
  );
}

const generateRandomOrderId = () => {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
};

export default function Checkout() {
  const [payment, setPayment] = useState('card');
  const [ordered, setOrdered] = useState(false);
  const { items, subtotal, tax, delivery, total, totalTaxRatePercent = 0, cgstRate = 0, sgstRate = 0, vatRate = 0, clearCart } = useCart();
  const { user, refreshUser } = useAuth();
  const { restaurantCode, settings } = useRestaurant();
  const [randomOrderId, setRandomOrderId] = useState('');

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      fullName: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      address: user?.addresses?.[0]?.address || '',
      city: user?.addresses?.[0]?.city || '',
      postcode: user?.addresses?.[0]?.pincode || '',
    }
  });

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [deliveryDetails, setDeliveryDetails] = useState(null);
  const [calculatingDelivery, setCalculatingDelivery] = useState(false);
  const [deliveryError, setDeliveryError] = useState(null);

  const [googleLoaded, setGoogleLoaded] = useState(!!window.google);
  const hasPreselected = useRef(false);

  // States for adding a new address inline on Checkout page
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [customTagVal, setCustomTagVal] = useState('');

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
  const [placeIdVal, setPlaceIdVal] = useState('');
  const [formattedAddressVal, setFormattedAddressVal] = useState('');
  const [postalCodeVal, setPostalCodeVal] = useState('');
  const [localityVal, setLocalityVal] = useState('');
  const [sublocalityVal, setSublocalityVal] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  const mapInstance = useRef(null);
  const markerInstance = useRef(null);

  // Monitor Google Maps API availability
  useEffect(() => {
    if (window.google) return;
    const interval = setInterval(() => {
      if (window.google && window.google.maps && window.google.maps.geometry) {
        setGoogleLoaded(true);
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Pre-select nearest address by default when coordinates are loaded
  useEffect(() => {
    if (hasPreselected.current || !user?.addresses || user.addresses.length === 0 || !settings?.latitude || !settings?.longitude) return;

    const restLat = Number(settings.latitude);
    const restLng = Number(settings.longitude);
    let closestAddress = null;
    let minDistance = Infinity;

    if (window.google && window.google.maps && window.google.maps.geometry) {
      user.addresses.forEach((addr) => {
        if (addr.latitude && addr.longitude) {
          const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
            new window.google.maps.LatLng(restLat, restLng),
            new window.google.maps.LatLng(Number(addr.latitude), Number(addr.longitude))
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestAddress = addr;
          }
        }
      });
      const finalAddr = closestAddress || user.addresses[0];
      setSelectedAddress(finalAddr);
      setValue('address', finalAddr.address);
      setValue('city', finalAddr.city);
      setValue('postcode', finalAddr.pincode);
      hasPreselected.current = true;
    }
  }, [user, settings, setValue, googleLoaded]);

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
        await refreshUser();

        // Select the newly added address immediately
        const newAddress = data.user?.addresses?.[data.user.addresses.length - 1];
        if (newAddress) {
          setSelectedAddress(newAddress);
          setValue('address', newAddress.address);
          setValue('city', newAddress.city);
          setValue('postcode', newAddress.pincode);
        }

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
      } else {
        toast.error(data.message || 'Failed to add address');
      }
    } catch (err) {
      console.error('Error adding address:', err);
      toast.error('Error adding address');
    }
  };

  // Google Maps picker inline initialization on Checkout Page
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

  // Dynamic Google Maps loader for Checkout
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

  const calculateDeliveryCharge = async (addressObj) => {
    if (!addressObj) return;
    setCalculatingDelivery(true);
    setDeliveryError(null);
    setDeliveryDetails(null);

    const destLat = Number(addressObj.latitude);
    const destLng = Number(addressObj.longitude);
    const destPlaceId = addressObj.place_id;

    if (!destLat || !destLng || !destPlaceId) {
      setDeliveryError("Selected address has missing location or Google Place ID components. Please update this address in your profile.");
      setCalculatingDelivery(false);
      return;
    }

    const restLat = settings?.latitude;
    const restLng = settings?.longitude;
    const maxDist = settings?.delivery?.max_distance || 0;

    if (!restLat || !restLng) {
      setDeliveryError("Restaurant coordinates are not configured by the admin yet.");
      setCalculatingDelivery(false);
      return;
    }

    // 1. Client-side Spherical Pre-check using Google Geometry Library
    if (window.google && window.google.maps && window.google.maps.geometry) {
      const p1 = new window.google.maps.LatLng(restLat, restLng);
      const p2 = new window.google.maps.LatLng(destLat, destLng);
      const straightLineDistMeters = window.google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
      const straightLineDistKm = straightLineDistMeters / 1000;

      if (maxDist > 0 && straightLineDistKm > maxDist) {
        setDeliveryError(`Delivery Unavailable: Selected location is outside our maximum delivery radius of ${maxDist} km.`);
        setCalculatingDelivery(false);
        return;
      }
    }

    // 2. Query routes/pricing calculation from backend
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/order/calculate-delivery/${restaurantCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_place_id: destPlaceId,
          customer_lat: destLat,
          customer_lng: destLng,
          subtotal: subtotal
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        setDeliveryError(resData.message || "Failed to calculate delivery fee.");
      } else {
        setDeliveryDetails(resData); // { distance, duration, delivery_charge }
      }
    } catch (err) {
      console.error(err);
      setDeliveryError("Error communicating with delivery server.");
    } finally {
      setCalculatingDelivery(false);
    }
  };

  // Re-run distance checker when selectedAddress or subtotal changes
  useEffect(() => {
    if (selectedAddress) {
      calculateDeliveryCharge(selectedAddress);
    }
  }, [selectedAddress, subtotal]);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  useGSAPReveal(containerRef);

  useEffect(() => {
    if (!user) {
      toast.error('Please sign in to place an order.', {
        style: { background: '#1A1A1A', color: '#fff', border: '1px solid rgba(242,122,26,0.3)', borderRadius: '12px' }
      });
      navigate(`/${restaurantCode}/login`.replace(/\/+/g, '/'));
    }
  }, [user, navigate, restaurantCode]);



  const onSubmit = async (data) => {
    if (!selectedAddress) {
      toast.error('Please select a saved address from the list to calculate delivery.');
      return;
    }
    if (deliveryError) {
      toast.error(deliveryError);
      return;
    }
    if (calculatingDelivery) {
      toast.error('Calculating delivery route, please wait...');
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const deliveryFee = deliveryDetails ? deliveryDetails.delivery_charge : 0;
      const finalTotal = subtotal + tax + deliveryFee;

      const fullAddressStr = selectedAddress?.exact_location
        ? `${selectedAddress.exact_location}, ${data.address}, ${data.city}, ${data.postcode}`
        : `${data.address}, ${data.city}, ${data.postcode}`;

      const payload = {
        customerInfo: {
          name: data.fullName,
          phone: data.phone,
          email: data.email,
          address: fullAddressStr,
        },
        orderInfo: {
          customer_id: user?._id || undefined,
          order_type: 'Delivery',
          order_status: 'Requested',
          order_source: 'Restaurant Website',
          order_items: items.map(item => ({
            dish_name: item.name,
            quantity: item.qty,
            dish_price: item.price
          })),
          sub_total: subtotal,
          cgst_percent: cgstRate,
          sgst_percent: sgstRate,
          vat_percent: vatRate,
          cgst_amount: subtotal * (cgstRate / 100),
          sgst_amount: subtotal * (sgstRate / 100),
          vat_amount: subtotal * (vatRate / 100),
          delivery_charge: deliveryFee,
          bill_amount: finalTotal,
          total_amount: finalTotal,
          paid_amount: payment === 'cod' ? 0 : finalTotal,
          payment_type: payment === 'card' ? 'Card' : payment === 'upi' ? 'UPI' : 'COD',
          payment_method: payment === 'card' ? 'Card' : payment === 'upi' ? 'UPI' : 'COD'
        }
      };

      const res = await fetch(`${API_URL}/order/delivery-from-site/${restaurantCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || 'Failed to place order');
      }

      // Automatically save address and profile details if new/unset
      if (user?._id) {
        let needsRefresh = false;

        if (!user.name || !user.phone) {
          const token = localStorage.getItem('ember-token');
          try {
            await fetch(`${API_URL}/web-customer/update/${user._id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                name: user.name || data.fullName,
                phone: user.phone || data.phone
              })
            });
            needsRefresh = true;
          } catch (e) {
            console.error('Failed to auto-update profile details', e);
          }
        }

        const isNewAddress = !user.addresses?.some(addr =>
          addr.address.toLowerCase().trim() === data.address.toLowerCase().trim() &&
          addr.city.toLowerCase().trim() === data.city.toLowerCase().trim()
        );

        if (isNewAddress) {
          const token = localStorage.getItem('ember-token');
          try {
            await fetch(`${API_URL}/web-customer/add-address/${user._id}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                address: data.address,
                city: data.city,
                state: 'State',
                country: 'India',
                pincode: data.postcode
              })
            });
            needsRefresh = true;
          } catch (e) {
            console.error('Failed to auto-save address', e);
          }
        }

        if (needsRefresh) {
          refreshUser();
        }
      }

      clearCart();
      setRandomOrderId(generateRandomOrderId());
      setOrdered(true);
      toast.success('Order placed successfully! 🎉', {
        duration: 4000,
        style: { background: '#1A1A1A', color: '#fff', border: '1px solid rgba(242,122,26,0.3)', borderRadius: '12px' },
      });
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to place order', {
        style: { background: '#1A1A1A', color: '#fff', border: '1px solid rgba(242,122,26,0.3)', borderRadius: '12px' },
      });
    }
  };

  if (ordered) {
    return (
      <main className="min-vh-100 d-flex align-items-center justify-content-center px-3" style={{ paddingTop: '8rem', paddingBottom: '6rem' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
          style={{ maxWidth: '400px' }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4"
            style={{ width: '96px', height: '96px', background: 'rgba(34, 197, 94, 0.2)', border: '2px solid rgba(34, 197, 94, 0.5)' }}
          >
            <CheckCircle size={48} className="text-success" />
          </motion.div>
          <h1 className="font-display fw-bold text-white mb-3 fs-2">Order Placed!</h1>
          <p className="text-white-60 mb-2">Your food is being prepared with love.</p>
          <p className="small text-white-60 mb-4" style={{ opacity: 0.7 }}>Estimated delivery: 30–45 minutes.</p>
          <div className="glass rounded-4 p-3 mb-4 small text-white-60">
            Order ID: <span className="text-white font-monospace">#{randomOrderId}</span>
          </div>
          <Link to="/" className="btn-primary d-inline-flex justify-content-center">Back to Home</Link>
        </motion.div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-vh-100 d-flex align-items-center justify-content-center px-3" style={{ paddingTop: '8rem', paddingBottom: '6rem' }}>
        <div className="text-center">
          <p className="text-white-60 mb-4">Your cart is empty. Add items before checking out.</p>
          <Link to="/menu" className="btn-primary d-inline-flex">Browse Menu <ChevronRight size={20} /></Link>
        </div>
      </main>
    );
  }

  return (
    <main ref={containerRef} className="min-vh-100 overflow-hidden" style={{ paddingTop: '8rem' }}>
      <div className="container-lg" style={{ maxWidth: '960px' }}>
        <div data-reveal="bottom" className="mb-5">
          <p className="section-subtitle mb-1">Almost There</p>
          <h1 className="font-display fw-bold text-white fs-1">
            <span className="text-gradient">Checkout</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="row g-5">
            {/* Left */}
            <div className="col-12 col-lg-7 d-flex flex-column gap-4">
              {/* Delivery Details */}
              <div data-reveal="left" data-delay="0.1" className="glass rounded-4 p-4">
                {showAddAddressForm ? (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="fw-semibold text-white mb-0">Add New Address</h5>
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
                      <div className="d-flex gap-2 mb-2">
                        <input
                          type="text"
                          id="map-search-input"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="input-field flex-grow-1 py-2.5 px-3 small text-white"
                          placeholder="Type area, street name to search on map..."
                        />
                      </div>
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
                    <div className="row g-3">
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
                        <button
                          type="button"
                          onClick={handleAddAddress}
                          className="btn-primary py-2.5 px-4 font-semibold shadow w-100 justify-content-center"
                        >
                          Save Address
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="fw-semibold text-white mb-0">Delivery Details</h5>
                      <button
                        type="button"
                        onClick={handleOpenAddAddressForm}
                        className="btn-primary py-1 px-3 small rounded"
                        style={{ fontSize: '11px' }}
                      >
                        + Add Address
                      </button>
                    </div>

                    {user?.addresses && user.addresses.length > 0 && (
                      <div className="mb-4">
                        <label className="form-label small text-white-60 mb-2">Select a Saved Address:</label>
                        <div className="d-flex flex-column gap-2 mb-4">
                          {user.addresses.map((addr) => (
                            <button
                              key={addr._id}
                              type="button"
                              onClick={() => {
                                setValue('address', addr.address);
                                setValue('city', addr.city);
                                setValue('postcode', addr.pincode);
                                setSelectedAddress(addr);
                                toast.success('Address populated!', {
                                  style: { background: '#1A1A1A', color: '#fff', border: '1px solid rgba(242,122,26,0.3)', borderRadius: '12px' }
                                });
                              }}
                              className={`btn text-start p-3 rounded-3 w-100 transition-all border text-white ${selectedAddress?._id === addr._id ? 'border-brand-500 bg-brand-500 bg-opacity-10' : 'border-white-10 hover:bg-white-5'}`}
                              style={{
                                background: selectedAddress?._id === addr._id ? 'rgba(242,122,26,0.05)' : 'rgba(255,255,255,0.02)',
                                fontSize: '0.9rem'
                              }}
                            >
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="fw-semibold small text-brand-400">
                                  {addr.tag || 'Address'} ({addr.city})
                                </span>
                                {selectedAddress?._id === addr._id && (
                                  <span className="badge bg-brand-500 text-white" style={{ fontSize: '10px' }}>Selected</span>
                                )}
                              </div>
                              <div className="small text-white-80">{addr.address}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {calculatingDelivery && (
                      <div className="alert bg-dark border border-white-10 text-white d-flex align-items-center gap-2 mb-4">
                        <span className="spinner-border spinner-border-sm text-brand-400" role="status" />
                        <span className="small">Calculating driving distance and delivery charges...</span>
                      </div>
                    )}

                    {deliveryError && (
                      <div className="alert alert-danger bg-danger bg-opacity-10 border border-danger border-opacity-20 text-white-80 small mb-4">
                        ❌ {deliveryError}
                      </div>
                    )}

                    {deliveryDetails && (
                      <div className="alert bg-success bg-opacity-10 border border-success border-opacity-20 text-white small mb-4">
                        <div className="fw-bold text-success mb-1">✓ Delivery Eligible!</div>
                        <div className="d-flex flex-column flex-wrap gap-x-4 text-white-80">
                          <div>Road Distance: <span className="text-white fw-bold">{deliveryDetails.distance} km</span></div>
                          <div>Estimated Time: <span className="text-white fw-bold">{deliveryDetails.duration}</span></div>
                          <div>Charge: <span className="text-white fw-bold">₹{deliveryDetails.delivery_charge === 0 ? 'Free' : deliveryDetails.delivery_charge}</span></div>
                        </div>
                      </div>
                    )}

                    <div className="row g-3">
                      <div className="col-12 col-sm-6">
                        <Field
                          label="Full Name" id="fullName"
                          placeholder="John Doe"
                          error={errors.fullName}
                          {...register('fullName', { required: 'Name is required' })}
                        />
                      </div>
                      <div className="col-12 col-sm-6">
                        <Field
                          label="Phone Number" id="phone"
                          placeholder="+44 7700 900000"
                          type="tel"
                          error={errors.phone}
                          {...register('phone', {
                            required: 'Phone is required',
                            pattern: { value: /^[+\d\s]{7,15}$/, message: 'Invalid phone number' },
                          })}
                        />
                      </div>
                      <div className="col-12">
                        <Field
                          label="Delivery Address" id="address"
                          placeholder="42 Gourmet Lane, London..."
                          error={errors.address}
                          {...register('address', { required: 'Address is required' })}
                          disabled
                        />
                      </div>
                      <div className="col-12 col-sm-6">
                        <Field
                          label="City" id="city"
                          placeholder="London"
                          error={errors.city}
                          {...register('city', { required: 'City is required' })}
                          disabled
                        />
                      </div>
                      <div className="col-12 col-sm-6">
                        <Field
                          label="Postcode" id="postcode"
                          placeholder="EC1A 1BB"
                          error={errors.postcode}
                          {...register('postcode', { required: 'Postcode is required' })}
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Note */}
              <div data-reveal="left" data-delay="0.3" className="glass rounded-4 p-4">
                <h5 className="fw-semibold text-white mb-3">Order Note (Optional)</h5>
                <textarea
                  id="note"
                  rows={3}
                  placeholder="Special instructions, allergies, or requests..."
                  className="input-field"
                  style={{ resize: 'none' }}
                  {...register('note')}
                />
              </div>
            </div>

            {/* Right — Summary */}
            <div data-reveal="right" className="col-12 col-lg-5 d-flex flex-column gap-4 position-sticky align-self-start" style={{ top: '7rem' }}>
              <div className="glass rounded-4 p-4">
                <h5 className="fw-semibold text-white mb-4">Order Summary</h5>

                {/* Items preview */}
                <div className="d-flex flex-column gap-3 mb-4 overflow-auto scrollbar-hide" style={{ maxHeight: '12rem' }}>
                  {items.map(item => (
                    <div key={item.id} className="d-flex gap-3 align-items-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="rounded-3 object-fit-cover" style={{ width: '40px', height: '40px' }} />
                      ) : (
                        <div className="rounded-3 d-flex align-items-center justify-content-center bg-dark-900 flex-shrink-0 shadow-sm position-relative overflow-hidden" style={{ width: '40px', height: '40px' }}>
                          <div className="position-absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle, var(--brand-500), transparent)' }} />
                          <div className="rounded-circle glass-strong d-flex align-items-center justify-content-center shadow-lg" style={{ width: '22px', height: '22px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <UtensilsCrossed size={10} className="text-brand-400" />
                          </div>
                        </div>
                      )}
                      <div className="flex-grow-1 min-w-0">
                        <p className="small text-white text-truncate mb-0">{item.name}</p>
                        <p className="small text-white-60 mb-0" style={{ fontSize: '12px' }}>x{item.qty}</p>
                      </div>
                      <span className="small text-white">₹{(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-top pt-3 d-flex flex-column gap-2 mb-4 small" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="d-flex justify-content-between text-white-60">
                    <span>Subtotal</span><span className="text-white">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between text-white-60">
                    <span>Delivery</span>
                    {deliveryDetails ? (
                      <span className={deliveryDetails.delivery_charge === 0 ? 'text-success fw-bold' : 'text-white'}>
                        {deliveryDetails.delivery_charge === 0 ? 'FREE' : `₹${deliveryDetails.delivery_charge.toFixed(2)}`}
                      </span>
                    ) : (
                      <span className="text-brand-400 font-italic small">Select Address</span>
                    )}
                  </div>
                  <div className="d-flex justify-content-between text-white-60">
                    <span>Tax ({totalTaxRatePercent}%)</span><span className="text-white">₹{tax.toFixed(2)}</span>
                  </div>
                </div>

                <div className="d-flex justify-content-between mb-0 border-top pt-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <span className="fw-semibold text-white">Total</span>
                  <span className="price-tag fs-3">₹{(subtotal + tax + (deliveryDetails ? deliveryDetails.delivery_charge : 0)).toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="glass rounded-4 p-4">
                <h5 className="fw-semibold text-white mb-4">Payment Method</h5>
                <div className="row g-3">
                  {PAYMENT_METHODS.map(({ id, label, Icon }) => (
                    <div key={id} className="col-12">
                      <button
                        type="button"
                        onClick={() => setPayment(id)}
                        className={`w-100 d-flex align-items-center gap-2 p-3 rounded-3 border transition-all text-start ${payment === id
                          ? 'border-brand-400 text-brand-400'
                          : 'border-white-10 text-white-60 hover:border-white-20 hover:text-white'
                          }`}
                        style={{ background: payment === id ? 'rgba(242, 122, 26, 0.1)' : 'rgba(255, 255, 255, 0.05)' }}
                      >
                        <Icon size={20} className="flex-shrink-0" />
                        <span className="small fw-medium">{label}</span>
                      </button>
                    </div>
                  ))}
                </div>

                {payment === 'card' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="row g-3 mt-3"
                  >
                    <div className="col-12">
                      <Field label="Card Number" id="cardNumber" placeholder="4242 4242 4242 4242" maxLength={19} />
                    </div>
                    <div className="col-6">
                      <Field label="Expiry Date" id="expiry" placeholder="MM / YY" />
                    </div>
                    <div className="col-6">
                      <Field label="CVV" id="cvv" placeholder="123" maxLength={3} type="password" />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Place Order Button at the very bottom */}
          <div className="mt-5 d-flex justify-content-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary pt-3 px-5 fs-5 fw-bold shadow-lg"
              style={{ minWidth: '250px', opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  Placing Order...
                </>
              ) : (
                <>Place Order <ChevronRight size={20} className="ms-2" /></>
              )}
            </button>
          </div>
        </form>
      </div>

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
          <p className="small text-white-60">Please allow location permissions if prompted by your browser.</p>
        </div>
      )}
    </main>
  );
}
