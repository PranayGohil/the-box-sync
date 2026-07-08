const Website = require("../models/WebsiteModel");
const Menu = require("../models/menuModel");
const User = require("../models/userModel");
const Reservation = require("../models/reservationModel");
const Subscription = require("../models/subscriptionModel");
const { sendEmail } = require("../utils/emailService");

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
        contact_title: "We'd Love to Hear From You",
        contact_subtitle: "Get in Touch",
        contact_details: "Whether you're booking a table, asking about our menu, or just want to say hello — reach out and we'll respond promptly.",
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
      contact_title,
      contact_subtitle,
      testimonials,
      social_links,
      map_location,
      place_id,
      formatted_address,
      latitude,
      longitude,
      city,
      state,
      country,
      postal_code,
      locality,
      sublocality,
      delivery,
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

    let parsedDelivery = {};
    if (delivery) {
      try {
        parsedDelivery = typeof delivery === 'string' ? JSON.parse(delivery) : delivery;
      } catch (e) {
        console.error("Error parsing delivery config", e);
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
        contact_title,
        contact_subtitle,
        testimonials: (typeof testimonials === 'string' && testimonials.trim()) ? JSON.parse(testimonials) : (Array.isArray(testimonials) ? testimonials : []),
        social_links: (typeof social_links === 'string' && social_links.trim()) ? JSON.parse(social_links) : (Array.isArray(social_links) ? social_links : []),
        map_location,
        place_id,
        formatted_address,
        latitude: latitude !== undefined && latitude !== '' ? Number(latitude) : undefined,
        longitude: longitude !== undefined && longitude !== '' ? Number(longitude) : undefined,
        city,
        state,
        country,
        postal_code,
        locality,
        sublocality,
        location: (latitude && longitude) ? {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)]
        } : undefined,
        delivery: parsedDelivery,
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

    let hasReservationAccess = false;
    const activeSub = await Subscription.findOne({
      user_id: user._id.toString(),
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

    let settings = await Website.findOne({ user_id: user._id.toString() });

    // Construct response with merged user data for location
    const response = {
      ...(settings ? settings.toObject() : {}),
      has_reservation_plan: hasReservationAccess,
      restaurant_name: settings?.restaurant_name || user.name || "Our Restaurant",
      logo: settings?.logo || user.logo,
      contact_email: settings?.contact_email || user.email,
      contact_phone: settings?.contact_phone || user.mobile,
      contact_title: settings?.contact_title || "We'd Love to Hear From You",
      contact_subtitle: settings?.contact_subtitle || "Get in Touch",
      contact_details: settings?.contact_details || "Whether you're booking a table, asking about our menu, or just want to say hello — reach out and we'll respond promptly.",
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
      // Pass through user address fields, prioritizing settings values
      address: settings?.restaurant_address || user.address || "",
      city: settings?.city || user.city || "",
      state: settings?.state || user.state || "",
      country: settings?.country || user.country || "",
      pincode: settings?.postal_code || user.pincode || "",
      // Include real feedbacks from user model
      restaurant_feedbacks: user.feedbacks || [],
      restaurant_token: user.restaurant_token || "",
      taxInfo: user.taxInfo || { cgst: 0, sgst: 0, vat: 0 }
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

// ✅ 5. Submit Public Contact Form (Sends email to restaurant owner)
exports.submitPublicContactForm = async (req, res) => {
  try {
    const { code } = req.params;
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const user = await User.findOne({ restaurant_code: code });
    if (!user) {
      return res.status(404).json({ error: "Restaurant not found." });
    }

    const settings = await Website.findOne({ user_id: user._id });

    // Send email to owner
    const ownerEmail = user.email;
    const emailSubject = `New Contact Form Submission: ${subject}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #f27a1a; border-bottom: 2px solid #f27a1a; padding-bottom: 10px;">Contact Inquiry Received</h2>
        <p>Hello <strong>${user.name || 'Owner'}</strong>,</p>
        <p>You have received a new message from the contact form on your restaurant website (<strong>${settings?.restaurant_name || user.name || 'Your Restaurant'}</strong>):</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; font-weight: bold; width: 120px; border-bottom: 1px solid #eee;">Name:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Email:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Subject:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${subject}</td>
          </tr>
        </table>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #f27a1a; margin-top: 15px;">
          <strong style="display: block; margin-bottom: 5px;">Message:</strong>
          <p style="white-space: pre-wrap; margin: 0; line-height: 1.5;">${message}</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: ownerEmail,
      subject: emailSubject,
      html: emailHtml,
      replyTo: email
    });

    res.json({ success: true, message: "Contact message sent successfully." });
  } catch (error) {
    console.error("Error sending contact email:", error);
    res.status(500).json({ error: "Failed to send contact message." });
  }
};
