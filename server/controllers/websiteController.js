const Website = require("../models/WebsiteModel");
const Menu = require("../models/menuModel");
const User = require("../models/userModel");
const Reservation = require("../models/reservationModel");

// GET current settings
exports.getWebsiteSettings = async (req, res) => {
  try {
    const settings = await Website.findOne({ user_id: req.user });
    const user = await User.findById(req.user);

    const fullAddress = user ? [user.address, user.city, user.state, user.pincode].filter(Boolean).join(", ") : "";

    if (!settings) {
      // Return defaults from user registration data if settings document doesn't exist yet
      return res.json({
        restaurant_name: user?.name || "",
        restaurant_address: fullAddress || "",
        contact_email: user?.email || "",
        contact_phone: user?.mobile || "",
        logo: user?.logo || "",
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
      hero_details,
      about_title,
      about_details,
      about_image,
      legacy_years,
      contact_details,
      testimonials,
      social_links,
    } = req.body;

    console.log("Updating website settings for user:", req.body);

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
      { user_id: req.user },
      {
        restaurant_name,
        restaurant_address,
        open_days,
        open_time_from,
        open_time_to,
        opening_hours: typeof opening_hours === 'string' ? JSON.parse(opening_hours) : opening_hours,
        contact_email,
        contact_phone,
        featured_dish_ids: parsedFeaturedDishes,
        logo,
        hero_title,
        hero_details,
        about_title,
        about_details,
        about_image,
        legacy_years,
        contact_details,
        testimonials: typeof testimonials === 'string' ? JSON.parse(testimonials) : testimonials,
        social_links: typeof social_links === 'string' ? JSON.parse(social_links) : social_links,
      },
      { new: true, upsert: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("Website update error:", err);
    res.status(500).json({ error: "Failed to update settings" });
  }
};

// GET all dishes for the restaurant
exports.getAllDishes = async (req, res) => {
  try {
    const websiteSettings = await Website.findOne({ user_id: req.user });
    const featuredIds = websiteSettings?.featured_dish_ids || [];

    const menus = await Menu.find({ user_id: req.user });

    const categorized = menus.map((menu) => {
      const dishesWithFlag = menu.dishes.map((dish) => ({
        ...dish._doc,
        _id: dish._id.toString(),
        is_featured: featuredIds.includes(dish._id.toString()),
      }));

      return {
        category: menu.category,
        meal_type: menu.meal_type,
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
      hero_details: settings?.hero_details || "Experience extraordinary flavors where every dish tells a story.",
      // Pass through user address fields
      address: user.address || "",
      city: user.city || "",
      state: user.state || "",
      country: user.country || "",
      pincode: user.pincode || ""
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
          meal_type: menu.meal_type,
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
