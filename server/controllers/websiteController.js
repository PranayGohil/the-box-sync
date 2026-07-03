const Website = require("../models/WebsiteModel");
const Menu = require("../models/menuModel");
const User = require("../models/userModel");
const Reservation = require("../models/reservationModel");
const Subscription = require("../models/subscriptionModel");

// GET current settings
exports.getWebsiteSettings = async (req, res) => {
  try {
    const userId = req.user?._id || req.user;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const settings = await Website.findOne({ user_id: userId });
    const user = await User.findById(userId);

    const fullAddress = user ? [user.address, user.city, user.state, user.pincode].filter(Boolean).join(", ") : "";

    // Check subscription / access tier for Reservation Management
    let hasReservationAccess = false;
    const activeSub = await Subscription.findOne({
      user_id: userId,
      plan_name: { $in: ["Reservation Management", "Reservation Manager"] },
      status: "active",
      end_date: { $gt: new Date() }
    });
    if (activeSub) {
      hasReservationAccess = true;
    } else {
      const tier = user?.purchasedPlan;
      if (tier === 'Fine Dine' || tier === 'Chain') {
        hasReservationAccess = true;
      }
    }

    if (!settings) {
      // Return defaults from user registration data if settings document doesn't exist yet
      return res.json({
        restaurant_name: user?.name || "",
        restaurant_address: fullAddress || "",
        contact_email: user?.email || "",
        contact_phone: user?.mobile || "",
        logo: user?.logo || "",
        show_reservation: true,
        has_reservation_plan: hasReservationAccess,
      });
    }

    // Merge existing settings with user data for empty fields
    
    const response = {
      ...settings.toObject(),
      restaurant_name: settings.restaurant_name || user?.name || "",
      restaurant_address: settings.restaurant_address || fullAddress || "",
      contact_email: settings.contact_email || user?.email || "",
      contact_phone: settings.contact_phone || user?.mobile || "",
      logo: settings.logo || user?.logo || "",
      show_reservation: settings.show_reservation !== undefined ? settings.show_reservation : true,
      has_reservation_plan: hasReservationAccess,
    };

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
};

// UPDATE settings
exports.updateWebsiteSettings = async (req, res) => {
  try {
    const {
      restaurant_name,
      restaurant_address,
      open_days,
      open_time_from,
      open_time_to,
      opening_hours,
      contact_email,
      contact_phone,
      featured_dish_ids,
      logo,
      hero_title,
      hero_subtitle,
      hero_details,
      hero_image,
      about_title,
      about_details,
      about_image,
      legacy_title,
      legacy_details,
      legacy_image,
      legacy_years,
      legacy_layout,
      legacy_bullets,
      contact_details,
      testimonials,
      social_links,
      map_location,
      show_reservation,
    } = req.body;

    const userId = req.user?._id || req.user;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    console.log("Updating website settings for user:", userId);

    // Parse featured_dish_ids only if it exists and is a valid JSON string
    let parsedFeaturedDishes = [];
    if (featured_dish_ids) {
      try {
        parsedFeaturedDishes = JSON.parse(featured_dish_ids);
      } catch (e) {
        return res
          .status(400)
          .json({ error: "Invalid featured_dish_ids format" });
      }
    }

    const updated = await Website.findOneAndUpdate(
      { user_id: userId },
      {
        restaurant_id: userId,
        restaurant_name,
        restaurant_address,
        open_days,
        open_time_from,
        open_time_to,
        opening_hours: (typeof opening_hours === 'string' && opening_hours.trim()) ? JSON.parse(opening_hours) : (Array.isArray(opening_hours) ? opening_hours : []),
        contact_email,
        contact_phone,
        featured_dish_ids: parsedFeaturedDishes,
        logo,
        hero_title,
        hero_subtitle,
        hero_details,
        hero_image,
        about_title,
        about_details,
        about_image,
        legacy_title,
        legacy_details,
        legacy_image,
        legacy_years,
        legacy_layout,
        legacy_bullets: (typeof legacy_bullets === 'string' && legacy_bullets.trim()) ? JSON.parse(legacy_bullets) : (Array.isArray(legacy_bullets) ? legacy_bullets : []),
        contact_details,
        testimonials: (typeof testimonials === 'string' && testimonials.trim()) ? JSON.parse(testimonials) : (Array.isArray(testimonials) ? testimonials : []),
        social_links: (typeof social_links === 'string' && social_links.trim()) ? JSON.parse(social_links) : (Array.isArray(social_links) ? social_links : []),
        map_location,
        show_reservation: show_reservation !== undefined ? show_reservation : true,
      },
      { new: true, upsert: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("Website update full error:", err);
    res.status(500).json({ 
      error: "Failed to update settings", 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
  }
};

// GET all dishes for the restaurant
exports.getAllDishes = async (req, res) => {
  try {
    const userId = req.user?._id || req.user;
    const websiteSettings = await Website.findOne({ user_id: userId });
    const featuredIds = websiteSettings?.featured_dish_ids || [];

    const menus = await Menu.find({ user_id: userId });

    const categorized = menus.map((menu) => {
      const dishesWithFlag = menu.dishes.map((dish) => ({
        ...dish._doc,
        _id: dish._id.toString(),
        is_featured: featuredIds.includes(dish._id.toString()),
      }));

      return {
        category: menu.category,
        dishes: dishesWithFlag,
      };
    });

    res.json(categorized);
  } catch (err) {
    console.error("Error fetching dishes:", err);
    res.status(500).json({ error: "Failed to fetch dishes" });
  }
};

// ✅ 1. Public Website Settings by restaurant_code
exports.getWebsiteSettingsByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const user = await User.findOne({ restaurant_code: code });
    if (!user) return res.status(404).json({ error: "Invalid restaurant code" });

    let settings = await Website.findOne({ user_id: user._id.toString() });
    
    // Construct response with merged user data for location
    const response = {
      ...(settings ? settings.toObject() : {}),
      restaurant_name: settings?.restaurant_name || user.name || "Our Restaurant",
      logo: settings?.logo || user.logo,
      contact_email: settings?.contact_email || user.email,
      contact_phone: settings?.contact_phone || user.mobile,
      hero_title: settings?.hero_title || "Welcome to Our Restaurant",
      hero_subtitle: settings?.hero_subtitle || "Delicious. Authentic. Fresh.",
      hero_details: settings?.hero_details || "Experience extraordinary flavors where every dish tells a story.",
      hero_image: settings?.hero_image || "",
      legacy_title: settings?.legacy_title || "Our Legacy",
      legacy_details: settings?.legacy_details || "A journey through flavors since our inception.",
      legacy_image: settings?.legacy_image || "",
      legacy_years: settings?.legacy_years || "10+",
      legacy_layout: settings?.legacy_layout || "image-right",
      legacy_bullets: settings?.legacy_bullets || [],
      map_location: settings?.map_location || "",
      show_reservation: settings && settings.show_reservation !== undefined ? settings.show_reservation : true,
      // Pass through user address fields
      address: user.address || "",
      city: user.city || "",
      state: user.state || "",
      country: user.country || "",
      pincode: user.pincode || "",
      // Include real feedbacks from user model
      restaurant_feedbacks: user.feedbacks || []
    };

    res.json(response);
  } catch (err) {
    console.error("Error fetching public settings:", err);
    res.status(500).json({ error: "Server error while fetching settings" });
  }
};

// ✅ 2. Public Featured Dishes by restaurant_code
exports.getFeaturedDishesByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const user = await User.findOne({ restaurant_code: code });
    if (!user) return res.status(404).json({ error: "Invalid restaurant code" });

    const websiteSettings = await Website.findOne({ user_id: user._id });
    const featuredIds = websiteSettings?.featured_dish_ids || [];

    const menus = await Menu.find({ user_id: user._id });

    const categorized = menus
      .map((menu) => {
        const filtered = menu.dishes.filter((dish) =>
          featuredIds.includes(dish._id.toString())
        );
        return {
          category: menu.category,
          dishes: filtered,
        };
      })
      .filter((group) => group.dishes.length > 0);

    res.json(categorized);
  } catch (err) {
    console.error("Error fetching featured dishes:", err);
    res.status(500).json({ error: "Server error while fetching featured dishes" });
  }
};

// ✅ 3. Public Reservation by restaurant_code
exports.createPublicReservation = async (req, res) => {
  try {
    const { code } = req.params;
    const user = await User.findOne({ restaurant_code: code });
    if (!user) return res.status(404).json({ error: "Invalid restaurant code" });

    const { name, phone, email, date, time, guests, requests } = req.body;

    const reservation = new Reservation({
      user_id: user._id,
      customer_name: name,
      customer_phone: phone,
      customer_email: email,
      reservation_date: date,
      slot_start: time,
      num_persons: guests,
      notes: requests,
      status: "pending",
    });

    await reservation.save();

    res.status(201).json({ message: "Reservation created successfully", reservation });
  } catch (err) {
    console.error("Error creating reservation:", err);
    res.status(500).json({ error: "Server error while creating reservation" });
  }
};

// ✅ 4. Public Menu by restaurant_code
exports.getPublicMenuByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const user = await User.findOne({ restaurant_code: code });
    if (!user) return res.status(404).json({ error: "Invalid restaurant code" });

    const menus = await Menu.find({ user_id: user._id });
    res.json(menus);
  } catch (err) {
    console.error("Error fetching public menu:", err);
    res.status(500).json({ error: "Server error while fetching menu" });
  }
};
