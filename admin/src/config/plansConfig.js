export const plans = [
  {
    name: 'QSR Plan',
    originalPrice: '₹10,000',
    price: '₹8,000',
    period: '/ year',
    color: 'primary',
    features: {
      billing: [
        'Inventory Management',
        'Statistics Management',
        'Third-party Integrations',
        'In-built CRM',
        'Menu Management',
        'Staff Management',
        'Unlimited Cash Register',
        'Multi-terminal Billing',
      ],
      addons: [
        'QSR Panel',
        'Kitchen Display System',
        'Token Management',
        'Scan & QR Order',
        'QR-based Feedback',
        'Dynamic Reports',
        'WhatsApp Invoice',
      ],
      loyalty: [
        'Customer Profiles',
        'Points Earn/Redeem at POS',
      ],
      advanced: [],
      support: [
        '24/7 Support',
        'Free Training',
        'Free Staff Re-training',
      ],
    },
  },
  {
    name: 'Café Plan',
    originalPrice: '₹12,500',
    price: '₹10,000',
    period: '/ year',
    color: 'success',
    features: {
      billing: [
        'Inventory Management',
        'Statistics Management',
        'Third-party Integrations',
        'In-built CRM',
        'Menu Management',
        'Staff Management',
        'Unlimited Cash Register',
        'Multi-terminal Billing',
      ],
      addons: [
        'QSR Panel',
        'Kitchen Display System',
        'Token Management',
        'Scan & QR Order',
        'QR-based Feedback',
        'Dynamic Reports',
        'WhatsApp Invoice',
        'Restaurant Website',
      ],
      loyalty: [
        'Customer Profiles',
        'Points Earn/Redeem at POS',
        'Automated Retention Campaigns',
      ],
      advanced: [],
      support: [
        '24/7 Support',
        'Free Training',
        'Free Staff Re-training',
      ],
    },
  },
  {
    name: 'Fine Dine Plan',
    originalPrice: '₹20,000',
    price: '₹16,000',
    period: '/ year',
    color: 'warning',
    features: {
      billing: [
        'Inventory Management',
        'Statistics Management',
        'Third-party Integrations',
        'In-built CRM',
        'Menu Management',
        'Staff Management',
        'Unlimited Users & Terminals',
        'Unlimited Cash Register',
        'Multi-terminal Billing',
      ],
      addons: [
        'Captain Panel',
        'Kitchen Display System',
        'Reservation Management',
        'Table Management',
        'Scan & QR Order',
        'QR-based Feedback',
        'Waiter Calling System',
        'Dynamic Reports',
        'WhatsApp Invoice',
        'Restaurant Website',
        'Manager Panel',
        'Cashier',
      ],
      loyalty: [
        'Customer Profiles',
        'Points Earn/Redeem at POS',
        'Automated Retention Campaigns',
        'Gamified Loyalty — Food Quests',
      ],
      advanced: [],
      support: [
        '24/7 Support',
        'Free Training',
        'Free Staff Re-training',
      ],
    },
  },
  {
    name: 'Cloud Plan',
    originalPrice: '₹12,500',
    price: '₹10,000',
    period: '/ year',
    color: 'info',
    features: {
      billing: [
        'Inventory Management',
        'Statistics Management',
        'Third-party Integrations',
        'In-built CRM',
        'Menu Management',
        'Staff Management',
        'Unlimited Cash Register',
        'Multi-terminal Billing',
      ],
      addons: [
        'QSR Panel',
        'Kitchen Display System',
        'QR-based Feedback',
        'Dynamic Reports',
        'WhatsApp Invoice',
        'Restaurant Website',
      ],
      loyalty: [
        'Customer Profiles',
        'Points Earn/Redeem at POS',
        'Automated Retention Campaigns',
      ],
      advanced: [],
      support: [
        '24/7 Support',
        'Free Training',
        'Free Staff Re-training',
      ],
    },
  },
  {
    name: 'Chain Plan',
    originalPrice: '₹30,000',
    price: '₹24,000',
    period: '/ year',
    color: 'danger',
    recommended: true,
    features: {
      billing: [
        'Inventory Management',
        'Statistics Management',
        'Third-party Integrations',
        'In-built CRM',
        'Menu Management',
        'Staff Management',
        'Unlimited Users & Terminals',
        'Unlimited Cash Register',
        'Multi-terminal Billing',
      ],
      addons: [
        'QSR Panel',
        'Captain Panel',
        'Kitchen Display System',
        'Reservation Management',
        'Table Management',
        'Token Management',
        'Scan & QR Order',
        'QR-based Feedback',
        'Waiter Calling System',
        'Dynamic Reports',
        'WhatsApp Invoice',
        'Restaurant Website',
        'Manager Panel',
        'Cashier',
      ],
      loyalty: [
        'Customer Profiles',
        'Points Earn/Redeem at POS',
        'Automated Retention Campaigns',
        'Gamified Loyalty — Food Quests',
      ],
      advanced: [
        'TheBoxSync Payroll',
      ],
      support: [
        '24/7 Support',
        'Free Training',
        'Free Staff Re-training',
        'Dedicated Account Manager',
      ],
    },
  },
];

export const featureCategories = [
  {
    title: 'Billing & Core',
    features: [
      'Inventory Management',
      'Statistics Management',
      'Third-party Integrations',
      'In-built CRM',
      'Menu Management',
      'Staff Management',
      'Unlimited Users & Terminals',
      'Unlimited Cash Register',
      'Multi-terminal Billing'
    ]
  },
  {
    title: 'Add-ons',
    features: [
      'QSR Panel',
      'Manager Panel',
      'Cashier',
      'Captain Panel',
      'Kitchen Display System',
      'Reservation Management',
      'Table Management',
      'Token Management',
      'Scan & QR Order',
      'QR-based Feedback',
      'Waiter Calling System',
      'Dynamic Reports',
      'WhatsApp Invoice',
      'Restaurant Website'
    ]
  },
  {
    title: 'Loyalty & CRM Engine',
    features: [
      'Customer Profiles',
      'Points Earn/Redeem at POS',
      'Automated Retention Campaigns',
      'Gamified Loyalty — Food Quests'
    ]
  },
  {
    title: 'Advanced',
    features: [
      'TheBoxSync Payroll'
    ]
  },
  {
    title: 'Support',
    features: [
      '24/7 Support',
      'Free Training',
      'Free Staff Re-training',
      'Dedicated Account Manager'
    ]
  }
];
