export const DIMENSION = {
  Desktop: 'desktop',
  Tablet: 'tablet',
  Mobile: 'mobile',
};

export const LAYOUT = {
  Fluid: 'fluid',
  Boxed: 'boxed',
};

export const RADIUS = {
  Rounded: 'rounded',
  Standard: 'standard',
  Flat: 'flat',
};

export const THEME_COLOR = {
  LightBlue: 'light-blue',
  DarkBlue: 'dark-blue',
  LightRed: 'light-red',
  DarkRed: 'dark-red',
  LightGreen: 'light-green',
  DarkGreen: 'dark-green',
  LightPurple: 'light-purple',
  DarkPurple: 'dark-purple',
  LightPink: 'light-pink',
  DarkPink: 'dark-pink',
};

export const NAV_COLOR = {
  Default: 'default',
  Light: 'light',
  Dark: 'dark',
};
export const MENU_PLACEMENT = {
  Vertical: 'vertical',
  Horizontal: 'horizontal',
};
export const MENU_BEHAVIOUR = {
  Pinned: 'pinned',
  Unpinned: 'unpinned',
};

export const USER_ROLE = {
  Admin: 'admin',
  Editor: 'editor',
};

export const isAccountingShopType = (shopType) => {
  if (!shopType) return false;
  const st = String(shopType).toLowerCase();
  const allowedKeywords = [
    'electronic',
    'mobile',
    'laptop',
    'computer',
    'hardware',
    'garment',
    'clothing',
    'jewellery',
    'stationery',
    'retail',
    'gift',
    'cosmetics',
    'beauty',
    'sports',
    'flower',
    'bouquet',
    'liquor',
    'wine',
    'medical',
    'pharmacy',
    'general store',
    'super market',
  ];
  return allowedKeywords.some((keyword) => st.includes(keyword));
};

export const isStorePreferencesNeeded = (shopType) => {
  if (!shopType) return false;
  const st = String(shopType).toLowerCase();
  const foodKeywords = [
    'general store',
    'super market',
    'grocery',
    'sweet',
    'mithai',
    'farshan',
    'bakery',
    'ice cream',
    'dairy',
    'milk',
    'juice',
    'snack',
    'vegetable',
    'fruit',
    'meat',
    'poultry',
    'restaurant',
    'cafe',
    'food',
    'dining',
  ];
  return foodKeywords.some((keyword) => st.includes(keyword));
};

export const ALLOWED_ACCOUNTING_SHOP_TYPES = [
  'electronic',
  'electronics',
  'electronics & mobile',
  'mobile',
  'laptop',
  'computer',
  'hardware shop',
  'hardware',
  'clothing / garment',
  'jewellery shop',
  'gift shop',
  'stationery shop',
];

