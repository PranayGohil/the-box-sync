import { Link } from 'react-router-dom';
import { Flame, MapPin, Phone, Mail } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';

// Inline social SVG icons (not available in this lucide version)
const InstagramIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/></svg>);
const TwitterIcon  = () => (<svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L2.002 2.25h6.561l4.264 5.637 5.417-5.637Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>);
const FacebookIcon = () => (<svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M24 12.073C24 5.406 18.627 0 12 0S0 5.406 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.696 4.533-4.696 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.931-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>);
const YoutubeIcon  = () => (<svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>);

const FOOTER_LINKS = {
  Explore:  [
    { label: 'Home',    to: '/'       },
    { label: 'Menu',    to: '/menu'   },
    { label: 'About',   to: '/about'  },
    { label: 'Contact', to: '/contact'},
  ],
  'Our Food': [
    { label: 'Pizza',   to: '/menu?cat=pizza'   },
    { label: 'Burgers', to: '/menu?cat=burger'  },
    { label: 'Sushi',   to: '/menu?cat=sushi'   },
    { label: 'Desserts',to: '/menu?cat=dessert' },
  ],
};

const SOCIALS = [
  { Icon: InstagramIcon, href: '#', label: 'Instagram' },
  { Icon: TwitterIcon,   href: '#', label: 'Twitter'   },
  { Icon: FacebookIcon,  href: '#', label: 'Facebook'  },
  { Icon: YoutubeIcon,   href: '#', label: 'YouTube'   },
];

export default function Footer() {
  const { restaurantCode, settings, menu } = useRestaurant();
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const logoUrl = settings?.logo 
    ? (settings.logo.startsWith('http') ? settings.logo : `${API_URL.replace('/api', '')}/uploads/${settings.logo.replace(/^\/+/, '')}`) 
    : null;

  // Dynamic categories for footer
  const footerCategories = Array.from(new Set(menu.map(item => item.category)))
    .slice(0, 4)
    .map(cat => ({
      label: cat,
      to: `/menu?cat=${cat}`
    }));

  const FOOTER_LINKS = {
    Explore: [
      { label: 'Home',    to: '/'       },
      { label: 'Menu',    to: '/menu'   },
      { label: 'Book',    to: '/reservation' },
      { label: 'Contact', to: '/contact'},
    ],
    'Our Food': footerCategories.length > 0 ? footerCategories : [
      { label: 'Pizza',   to: '/menu?cat=pizza'   },
      { label: 'Burgers', to: '/menu?cat=burger'  },
      { label: 'Sushi',   to: '/menu?cat=sushi'   },
      { label: 'Desserts',to: '/menu?cat=dessert' },
    ],
  };

  const socialLinks = settings?.social_links || [
    { platform: 'Instagram', url: '#', logo: null },
    { platform: 'Twitter',   url: '#', logo: null },
    { platform: 'Facebook',  url: '#', logo: null },
  ];

  return (
    <footer className="position-relative mt-5 border-top" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      {/* Glow top */}
      <div className="position-absolute top-0 start-50 translate-middle-x w-75" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(242, 122, 26, 0.5), transparent)' }} />

      <div className="container-lg py-5">
        <div className="row g-4">
          {/* Brand */}
          <div className="col-12 col-lg-3">
            <Link to={`/${restaurantCode || ''}`} className="d-flex align-items-center gap-2 mb-3 text-decoration-none">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={settings?.restaurant_name || "Logo"} 
                  className="rounded-3 shadow-sm object-fit-cover" 
                  style={{ width: '36px', height: '36px' }} 
                />
              ) : (
                <div 
                  className="rounded-3 d-flex align-items-center justify-content-center shadow-sm"
                  style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, var(--brand), #e05c0c)' }}
                >
                  <Flame className="text-white" size={20} />
                </div>
              )}
              <span className="font-display fw-bold fs-5">
                <span className="text-white">{settings?.restaurant_name || 'Ember'}</span>
                {!settings?.restaurant_name && <span className="text-gradient"> &amp; Gold</span>}
              </span>
            </Link>
            <p className="text-white-60 small mb-4" style={{ lineHeight: 1.6 }}>
              {settings?.contact_details || 'Fine dining reimagined. Where every dish is crafted with passion and every moment is worth savouring.'}
            </p>
            {/* Socials */}
            <div className="d-flex gap-2">
              {socialLinks.map((social, i) => {
                const socialLogoUrl = social.logo 
                  ? (social.logo.startsWith('http') ? social.logo : `${API_URL.replace('/api', '')}/uploads/menu/${social.logo.replace(/^\/+/, '')}`)
                  : null;

                return (
                  <a
                    key={i}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-circle glass d-flex align-items-center justify-content-center text-white-60 transition-colors hover:text-brand-400"
                    style={{ width: '36px', height: '36px', textDecoration: 'none' }}
                  >
                    {socialLogoUrl ? (
                      <img 
                        src={socialLogoUrl} 
                        alt={social.platform} 
                        style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                      />
                    ) : (
                      <span className="small fw-bold">{social.platform?.charAt(0)}</span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title} className="col-6 col-md-3">
              <h5 className="fw-semibold text-white mb-3">{title}</h5>
              <ul className="list-unstyled d-flex flex-column gap-2">
                {links.map(link => {
                  const fullPath = `/${restaurantCode || ''}${link.to}`.replace(/\/+/g, '/');
                  return (
                    <li key={link.label}>
                      <Link
                        to={fullPath}
                        className="text-white-60 text-decoration-none small transition-colors hover:text-brand-400"
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div className="col-12 col-md-3">
            <h5 className="fw-semibold text-white mb-3">Contact</h5>
            <ul className="list-unstyled d-flex flex-column gap-2">
              <li className="d-flex align-items-start gap-2 text-white-60 small">
                <MapPin size={16} className="text-brand-400 flex-shrink-0 mt-1" />
                {(() => {
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
                })()}
              </li>
              <li className="d-flex align-items-center gap-2 text-white-60 small">
                <Phone size={16} className="text-brand-400 flex-shrink-0" />
                {settings?.contact_phone || '+44 20 7946 0823'}
              </li>
              <li className="d-flex align-items-center gap-2 text-white-60 small">
                <Mail size={16} className="text-brand-400 flex-shrink-0" />
                {settings?.contact_email || 'hello@emberandgold.com'}
              </li>
            </ul>
            <div className="mt-4 glass rounded-3 p-3">
              <h6 className="small text-brand-400 fw-bold mb-2">Opening Hours</h6>
              {settings?.opening_hours?.length > 0 ? (
                <div className="d-flex flex-column gap-1">
                  {settings.opening_hours.map((h, i) => (
                    <div key={i} className="d-flex justify-content-between small">
                      <span className="text-white-60">{h.day}</span>
                      <span className="text-white fw-medium">{h.from} - {h.to}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="fw-semibold text-white mb-0 small text-center">
                  {settings?.open_time_from ? `${settings.open_time_from} - ${settings.open_time_to}` : '12:00 PM – 11:00 PM'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-5 pt-4 border-top d-flex flex-column flex-md-row align-items-center justify-content-between gap-3" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <p className="small text-white-60 mb-0">
            © {new Date().getFullYear()} {settings?.restaurant_name || 'Ember & Gold'}. All rights reserved.
          </p>
          <div className="d-flex gap-4">
            {['Privacy Policy', 'Terms of Service', 'Allergen Info'].map(t => (
              <a key={t} href="#" className="small text-white-60 text-decoration-none transition-colors">
                {t}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
