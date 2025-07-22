const Website = require("../models/WebsiteModel");
const Menu = require("../models/menuListModel");
const User = require("../models/userModel");

// GET current settings
exports.getWebsiteSettings = async (req, res) => {
  try {
    const settings = await Website.findOne({
      restaurant_id: req.user,
    });
    res.json(settings);
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
      contact_email,
      contact_phone,
      featured_dish_ids,
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
      { restaurant_id: req.user },
      {
        restaurant_name,
        restaurant_address,
        open_days,
        open_time_from,
        open_time_to,
        contact_email,
        contact_phone,
        featured_dish_ids: parsedFeaturedDishes,
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
    const websiteSettings = await Website.findOne({ restaurant_id: req.user });
    const featuredIds = websiteSettings?.featured_dish_ids || [];

    const menus = await Menu.find({ hotel_id: req.user });

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

    const settings = await Website.findOne({ restaurant_id: user._id });
    if (!settings)
      return res.status(404).json({ error: "No settings found for this restaurant" });

    res.json(settings);
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

    const websiteSettings = await Website.findOne({ restaurant_id: user._id });
    const featuredIds = websiteSettings?.featured_dish_ids || [];

    const menus = await Menu.find({ hotel_id: user._id });

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
