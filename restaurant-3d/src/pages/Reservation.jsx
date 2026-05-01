import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Calendar, Clock, Users, User, Mail, Phone, MessageSquare, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGSAPReveal } from '../hooks/useScroll';
import { useRestaurant } from '../context/RestaurantContext';

function Field({ label, id, error, as = 'input', icon: Icon, ...props }) {
  const cls = `input-field w-100 ${error ? 'border-danger' : ''}`;
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label small text-white-60 mb-1">{label}</label>
      <div className="position-relative">
        {Icon && <Icon className="position-absolute text-white-60" size={16} style={{ top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />}
        {as === 'textarea'
          ? <textarea id={id} className={`${cls}`} style={{ resize: 'none', paddingLeft: Icon ? '2.5rem' : undefined }} {...props} />
          : as === 'select' 
            ? <select id={id} className={cls} style={{ paddingLeft: Icon ? '2.5rem' : undefined }} {...props}>{props.children}</select>
            : <input id={id} className={cls} style={{ paddingLeft: Icon ? '2.5rem' : undefined }} {...props} />
        }
      </div>
      {error && <p className="small text-danger mt-1 mb-0">{error.message}</p>}
    </div>
  );
}

export default function Reservation() {
  const [booked, setBooked] = useState(false);
  const containerRef = useRef(null);
  useGSAPReveal(containerRef);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm();
  const { restaurantCode } = useRestaurant();

  const onSubmit = async (data) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/website/reservation/${restaurantCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit reservation');
      }

      setBooked(true);
      reset();
      toast.success('Table reserved successfully! 🎉', {
        duration: 4000,
        style: { background: '#1A1A1A', color: '#fff', border: '1px solid rgba(242,122,26,0.3)', borderRadius: '12px' },
      });
    } catch (error) {
      console.error('Reservation error:', error);
      toast.error('Failed to book table. Please try again later.');
    }
  };

  if (booked) {
    return (
      <main className="min-vh-100 d-flex align-items-center justify-content-center px-3 overflow-hidden" style={{ paddingTop: '8rem', paddingBottom: '6rem' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center glass rounded-4 p-4 p-md-5"
          style={{ maxWidth: '450px' }}
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
          <h2 className="font-display fw-bold text-white mb-3">Reservation Confirmed!</h2>
          <p className="text-white-60 mb-2">We look forward to hosting you.</p>
          <p className="small text-white-60 mb-4" style={{ opacity: 0.7 }}>A confirmation email has been sent with the details.</p>
          <button onClick={() => setBooked(false)} className="btn-primary w-100 justify-content-center">
            Book Another Table
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <main ref={containerRef} className="min-vh-100 overflow-hidden" style={{ paddingTop: '8rem', paddingBottom: '6rem' }}>
      <div className="container-lg" style={{ maxWidth: '900px' }}>
        <div data-reveal="bottom" className="text-center mb-5">
          <p className="section-subtitle mb-2">Join Us</p>
          <h1 className="font-display fw-bold text-white" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
            Book a <span className="text-gradient">Table</span>
          </h1>
          <p className="text-white-60 mt-3 mx-auto" style={{ maxWidth: '36rem' }}>
            Reserve your spot for an unforgettable cinematic dining experience.
          </p>
        </div>

        <div data-reveal="scale" className="glass rounded-4 p-4 p-md-5 position-relative overflow-hidden shadow">
          {/* Subtle background glow */}
          <div className="position-absolute rounded-circle pointer-events-none" style={{ top: 0, right: 0, width: '500px', height: '500px', background: 'rgba(242, 122, 26, 0.05)', filter: 'blur(120px)' }} />

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="position-relative z-1 d-flex flex-column gap-5">
            {/* Step 1: Booking Details */}
            <div>
              <h4 className="fw-semibold text-white mb-4 border-bottom pb-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Booking Details</h4>
              <div className="row g-4">
                <div className="col-12 col-sm-4">
                  <Field 
                    label="Date" id="date" type="date" icon={Calendar}
                    error={errors.date}
                    {...register('date', { required: 'Please select a date' })} 
                  />
                </div>
                <div className="col-12 col-sm-4">
                  <Field 
                    label="Time" id="time" as="select" icon={Clock}
                    error={errors.time}
                    {...register('time', { required: 'Please select a time' })} 
                  >
                    <option value="" className="text-white-60 bg-dark">Select Time</option>
                    <option value="18:00" className="text-white bg-dark">18:00 (6:00 PM)</option>
                    <option value="18:30" className="text-white bg-dark">18:30 (6:30 PM)</option>
                    <option value="19:00" className="text-white bg-dark">19:00 (7:00 PM)</option>
                    <option value="19:30" className="text-white bg-dark">19:30 (7:30 PM)</option>
                    <option value="20:00" className="text-white bg-dark">20:00 (8:00 PM)</option>
                    <option value="20:30" className="text-white bg-dark">20:30 (8:30 PM)</option>
                    <option value="21:00" className="text-white bg-dark">21:00 (9:00 PM)</option>
                  </Field>
                </div>
                <div className="col-12 col-sm-4">
                  <Field 
                    label="Party Size" id="guests" as="select" icon={Users}
                    error={errors.guests}
                    {...register('guests', { required: 'Please select party size' })} 
                  >
                    <option value="" className="text-white-60 bg-dark">Select Guests</option>
                    {[1,2,3,4,5,6,7,8,9,10].map(num => (
                      <option key={num} value={num} className="text-white bg-dark">{num} {num === 1 ? 'Person' : 'People'}</option>
                    ))}
                    <option value="10+" className="text-white bg-dark">More than 10 (Call us)</option>
                  </Field>
                </div>
              </div>
            </div>

            {/* Step 2: Personal Details */}
            <div>
              <h4 className="fw-semibold text-white mb-4 border-bottom pb-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Your Details</h4>
              <div className="row g-4">
                <div className="col-12 col-sm-6">
                  <Field 
                    label="Full Name" id="name" placeholder="John Doe" icon={User}
                    error={errors.name}
                    {...register('name', { required: 'Name is required' })} 
                  />
                </div>
                <div className="col-12 col-sm-6">
                  <Field 
                    label="Phone Number" id="phone" type="tel" placeholder="+44 7700 900000" icon={Phone}
                    error={errors.phone}
                    {...register('phone', { 
                      required: 'Phone is required',
                      pattern: { value: /^[+\d\s]{7,15}$/, message: 'Invalid phone number' }
                    })} 
                  />
                </div>
                <div className="col-12">
                  <Field 
                    label="Email Address" id="email" type="email" placeholder="john@example.com" icon={Mail}
                    error={errors.email}
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' }
                    })} 
                  />
                </div>
                <div className="col-12">
                  <Field 
                    label="Special Requests (Optional)" id="requests" as="textarea" rows={3} placeholder="Allergies, occasion, seating preference..." icon={MessageSquare}
                    {...register('requests')} 
                  />
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="btn-primary w-100 justify-content-center fs-5 py-3"
                style={{ opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Confirming...
                  </>
                ) : (
                  'Confirm Reservation'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
