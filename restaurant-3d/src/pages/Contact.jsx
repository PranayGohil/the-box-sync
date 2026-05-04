import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGSAPReveal } from '../hooks/useScroll';
import { useRef } from 'react';
import { useRestaurant } from '../context/RestaurantContext';

// Inline social SVG icons
const InstagramIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width="20" height="20"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/></svg>);
const TwitterIcon  = () => (<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L2.002 2.25h6.561l4.264 5.637 5.417-5.637Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>);
const FacebookIcon = () => (<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M24 12.073C24 5.406 18.627 0 12 0S0 5.406 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.696 4.533-4.696 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.931-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>);
const YoutubeIcon  = () => (<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>);
const WhatsappIcon = () => (<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.393 0 12.03c0 2.12.554 4.189 1.602 6.006L0 24l6.117-1.604a11.803 11.803 0 005.925 1.585h.005c6.634 0 12.032-5.391 12.036-12.028a11.8 11.8 0 00-3.417-8.467z"/></svg>);

// We will construct CONTACT_INFO inside the component using dynamic settings

const SOCIALS = [
  { Icon: InstagramIcon, href: '#', label: 'Instagram' },
  { Icon: TwitterIcon,   href: '#', label: 'Twitter'   },
  { Icon: FacebookIcon,  href: '#', label: 'Facebook'  },
];

function Field({ label, id, error, as = 'input', ...props }) {
  const cls = `input-field w-100 ${error ? 'border-danger' : ''}`;
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label small text-white-60 mb-1">{label}</label>
      {as === 'textarea'
        ? <textarea id={id} className={`${cls}`} style={{ resize: 'none' }} {...props} />
        : <input    id={id} className={cls} {...props} />
      }
      {error && <p className="small text-danger mt-1 mb-0">{error.message}</p>}
    </div>
  );
}

export default function Contact() {
  const { settings } = useRestaurant();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm();
  const containerRef = useRef(null);
  useGSAPReveal(containerRef);

  const formattedAddress = (() => {
    if (!settings) return '42 Gourmet Lane, South End, London EC1A 1BB';
    const addr = settings.address || settings.restaurant_address || settings.contact_address;
    if (!addr) return '42 Gourmet Lane, South End, London EC1A 1BB';
    
    const parts = [
      addr,
      settings.city,
      settings.state,
      settings.country
    ].filter(Boolean);
    
    let result = parts.join(', ');
    if (settings.pincode) result += ` - ${settings.pincode}`;
    return result;
  })();

  const CONTACT_INFO = [
    { Icon: MapPin, label: 'Address',       value: formattedAddress },
    { Icon: Phone,  label: 'Reservations',  value: settings?.contact_phone || '+44 20 7946 0823' },
    { Icon: Mail,   label: 'Email',         value: settings?.contact_email || 'hello@emberandgold.com' },
  ];

  const socialLinks = settings?.social_links || [
    { platform: 'Instagram', url: '#', logo: null },
    { platform: 'Twitter',   url: '#', logo: null },
    { platform: 'Facebook',  url: '#', logo: null },
  ];

  const getSocialIcon = (platform) => {
    const p = platform?.toLowerCase();
    if (p?.includes('instagram')) return <InstagramIcon />;
    if (p?.includes('twitter') || p?.includes('x')) return <TwitterIcon />;
    if (p?.includes('facebook')) return <FacebookIcon />;
    if (p?.includes('youtube')) return <YoutubeIcon />;
    if (p?.includes('whatsapp')) return <WhatsappIcon />;
    return <span className="fw-bold">{platform?.charAt(0)}</span>;
  };

  const mapSrc = (() => {
    const loc = settings?.map_location;
    if (!loc) return "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2482.8853555553397!2d-0.09997578422955879!3d51.5203701795978!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48761ca65b0a38bb%3A0x42f36e7d3e7b9e0!2sCity%20of%20London!5e0!3m2!1sen!2suk!4v1614000000000!5m2!1sen!2suk";
    
    // Extract src from iframe if it's a full tag
    const match = loc.match(/src="([^"]+)"/);
    return match ? match[1] : loc;
  })();

  const onSubmit = async () => {
    await new Promise(r => setTimeout(r, 1200));
    setSent(true);
    reset();
    toast.success('Message sent! We\'ll be in touch soon.', {
      style: { background: '#1A1A1A', color: '#fff', border: '1px solid rgba(242,122,26,0.3)', borderRadius: '12px' },
    });
  };

  return (
    <main ref={containerRef} className="min-vh-100 overflow-hidden" style={{ paddingTop: '8rem', paddingBottom: '6rem' }}>
      <div className="container-lg" style={{ maxWidth: '1140px' }}>
        {/* Header */}
        <div data-reveal="bottom" className="text-center mb-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="section-subtitle mb-2">Get in Touch</p>
            <h1 className="section-title text-white">
              We'd Love to <span className="text-gradient">Hear From You</span>
            </h1>
            <p className="text-white-60 mt-3 mx-auto" style={{ maxWidth: '36rem' }}>
              Whether you're booking a table, asking about our menu, or just want to say hello — reach out and we'll respond promptly.
            </p>
          </motion.div>
        </div>

        <div className="row g-5">
          {/* Left — Info */}
          <div className="col-12 col-lg-6" data-reveal="left">
            <div className="d-flex flex-column gap-3 mb-4">
              {CONTACT_INFO.map(({ Icon, label, value }) => (
                <div key={label} className="d-flex gap-3 glass rounded-4 p-3 align-items-start">
                  <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px', background: 'rgba(242, 122, 26, 0.1)', border: '1px solid rgba(242, 122, 26, 0.2)' }}>
                    <Icon size={20} className="text-brand-400" />
                  </div>
                  <div>
                    <p className="small text-white-60 mb-0" style={{ fontSize: '12px' }}>{label}</p>
                    <p className="text-white small fw-medium mb-0">{value}</p>
                  </div>
                </div>
              ))}
              
              {/* Multi-Opening Hours */}
              <div className="d-flex gap-3 glass rounded-4 p-3 align-items-start">
                <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px', background: 'rgba(242, 122, 26, 0.1)', border: '1px solid rgba(242, 122, 26, 0.2)' }}>
                  <Clock size={20} className="text-brand-400" />
                </div>
                <div className="w-100">
                  <p className="small text-white-60 mb-1" style={{ fontSize: '12px' }}>Opening Hours</p>
                  {settings?.opening_hours?.length > 0 ? (
                    <div className="d-flex flex-column gap-1 mt-1">
                      {settings.opening_hours.map((h, i) => (
                        <div key={i} className="d-flex justify-content-between small pe-2">
                          <span className="text-white-60">{h.day}</span>
                          <span className="text-white fw-medium">{h.from} - {h.to}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white small fw-medium mb-0">
                      {settings?.open_days || 'Daily'}: {settings?.open_time_from || '12:00'} – {settings?.open_time_to || '23:00'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Socials */}
            <div className="mb-5">
              <p className="small text-white-60 mb-3">Follow our story</p>
              <div className="d-flex gap-3">
                {socialLinks.map((social, i) => {
                  let href = social.url;
                  if (social.platform?.toLowerCase() === 'whatsapp' && !href.startsWith('http')) {
                    href = `https://wa.me/${href.replace(/\D/g, '')}`;
                  }

                  return (
                    <a
                      key={i}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.platform}
                      className="rounded-circle glass d-flex align-items-center justify-content-center text-white-60 transition-colors hover:text-brand-400"
                      style={{ width: '45px', height: '45px' }}
                    >
                      {getSocialIcon(social.platform)}
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Google Map Embed */}
            <div className="rounded-4 overflow-hidden border" style={{ height: '224px', borderColor: 'rgba(255,255,255,0.1)' }}>
              <iframe
                title="Restaurant location"
                src={mapSrc}
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>

          {/* Right — Form */}
          <div className="col-12 col-lg-6" data-reveal="right">
            <div className="glass rounded-4 p-4 p-md-5 h-100">
              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="d-flex flex-column align-items-center justify-content-center text-center py-5 h-100"
                >
                  <CheckCircle size={64} className="text-success mb-4" />
                  <h3 className="fw-semibold text-white mb-2">Message Sent!</h3>
                  <p className="text-white-60 mb-4">We'll get back to you within 24 hours.</p>
                  <button onClick={() => setSent(false)} className="btn-ghost">
                    Send Another
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} noValidate className="d-flex flex-column gap-3 h-100">
                  <h4 className="fw-semibold text-white mb-4">Send Us a Message</h4>

                  <div className="row g-3">
                    <div className="col-12 col-sm-6">
                      <Field label="Full Name" id="name" placeholder="Your name" error={errors.name}
                        {...register('name', { required: 'Name is required' })} />
                    </div>
                    <div className="col-12 col-sm-6">
                      <Field label="Email" id="contactEmail" placeholder="you@example.com" type="email" error={errors.contactEmail}
                        {...register('contactEmail', {
                          required: 'Email is required',
                          pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
                        })} />
                    </div>
                  </div>

                  <Field label="Subject" id="subject" placeholder="How can we help?" error={errors.subject}
                    {...register('subject', { required: 'Subject is required' })} />

                  <Field label="Message" id="message" as="textarea" rows={5} placeholder="Tell us more..." error={errors.message}
                    {...register('message', { required: 'Message is required', minLength: { value: 20, message: 'At least 20 characters' } })} />

                  <button type="submit" disabled={isSubmitting} className="btn-primary w-100 justify-content-center mt-auto" style={{ opacity: isSubmitting ? 0.6 : 1 }}>
                    {isSubmitting ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Sending...
                      </>
                    ) : (
                      <><Send size={20} className="me-2" /> Send Message</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
