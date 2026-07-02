import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, Smartphone, Banknote, ChevronRight, UtensilsCrossed } from 'lucide-react';
import { useCart, useAuth } from '../context/AppContext';
import { useRestaurant } from '../context/RestaurantContext';
import { useGSAPReveal } from '../hooks/useScroll';
import { useRef } from 'react';
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

export default function Checkout() {
  const [payment, setPayment] = useState('card');
  const [ordered, setOrdered] = useState(false);
  const { items, subtotal, tax, delivery, total, clearCart } = useCart();
  const { user, refreshUser } = useAuth();
  const { restaurantCode } = useRestaurant();
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

  const onSubmit = async (data) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const payload = {
        customerInfo: {
          name: data.fullName,
          phone: data.phone,
          email: data.email,
          address: `${data.address}, ${data.city}, ${data.postcode}`,
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
          cgst_percent: 5,
          sgst_percent: 5,
          cgst_amount: subtotal * 0.05,
          sgst_amount: subtotal * 0.05,
          bill_amount: total,
          total_amount: total,
          paid_amount: payment === 'cod' ? 0 : total,
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

      // Automatically save address if it's new
      if (user?._id) {
        const isNewAddress = !user.addresses?.some(addr =>
          addr.address.toLowerCase().trim() === data.address.toLowerCase().trim() &&
          addr.city.toLowerCase().trim() === data.city.toLowerCase().trim()
        );

        if (isNewAddress) {
          const token = localStorage.getItem('ember-token');
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
          // Refresh user context so it updates globally
          refreshUser();
        }
      }

      clearCart();
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
            Order ID: <span className="text-white font-monospace">#{Math.random().toString(36).slice(2, 10).toUpperCase()}</span>
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
                <h5 className="fw-semibold text-white mb-4">Delivery Details</h5>

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
                            toast.success('Address populated!', {
                              style: { background: '#1A1A1A', color: '#fff', border: '1px solid rgba(242,122,26,0.3)', borderRadius: '12px' }
                            });
                          }}
                          className="btn text-start p-3 rounded-3 w-100 transition-colors border border-white-10 text-white hover:bg-white-5"
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            fontSize: '0.9rem'
                          }}
                        >
                          <div className="fw-semibold small text-brand-400 mb-1">
                            {addr.city}, {addr.pincode}
                          </div>
                          <div className="small text-white-80">{addr.address}</div>
                        </button>
                      ))}
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
                      label="Email Address" id="email"
                      placeholder="john@example.com"
                      type="email"
                      error={errors.email}
                      {...register('email', {
                        required: 'Email is required',
                        pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
                      })}
                    />
                  </div>
                  <div className="col-12">
                    <Field
                      label="Delivery Address" id="address"
                      placeholder="42 Gourmet Lane, London..."
                      error={errors.address}
                      {...register('address', { required: 'Address is required' })}
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <Field
                      label="City" id="city"
                      placeholder="London"
                      error={errors.city}
                      {...register('city', { required: 'City is required' })}
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <Field
                      label="Postcode" id="postcode"
                      placeholder="EC1A 1BB"
                      error={errors.postcode}
                      {...register('postcode', { required: 'Postcode is required' })}
                    />
                  </div>
                </div>
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
                    <span className={delivery === 0 ? 'text-success' : 'text-white'}>
                      {delivery === 0 ? 'FREE' : `₹${delivery.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between text-white-60">
                    <span>Tax</span><span className="text-white">₹{tax.toFixed(2)}</span>
                  </div>
                </div>

                <div className="d-flex justify-content-between mb-0 border-top pt-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <span className="fw-semibold text-white">Total</span>
                  <span className="price-tag fs-3">₹{total.toFixed(2)}</span>
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
    </main>
  );
}
