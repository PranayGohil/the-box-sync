const fs = require("fs");
const path = require("path");
const Menu = require("../models/menuModel");
const User = require("../models/userModel");
const { count } = require("console");

const addMenu = async (req, res) => {
  try {
    const user_id = req.user;
    let { category, counter, hide_on_kot, dishes } = req.body;

    let parsedDishes;

    if (typeof dishes === "string") {
      try {
        parsedDishes = JSON.parse(dishes);
      } catch (e) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid dishes JSON" });
      }
    } else if (Array.isArray(dishes)) {
      parsedDishes = dishes;
    } else {
      return res.status(400).json({
        success: false,
        message: "dishes must be an array or JSON string",
      });
    }

    if (
      !category ||
      !Array.isArray(parsedDishes) ||
      parsedDishes.length === 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const uploadedImages = req.files?.dish_img || [];
    uploadedImages.forEach((file, index) => {
      if (parsedDishes[index]) {
        parsedDishes[index].dish_img = "/menu/dishes/" + file.filename;
      }
    });

    parsedDishes = parsedDishes.map((dish) => {
      let parsedVariants;
      if (dish.variants) {
        if (typeof dish.variants === "string") {
          try {
            parsedVariants = JSON.parse(dish.variants);
          } catch (e) {
            // ignore invalid
          }
        } else if (Array.isArray(dish.variants)) {
          parsedVariants = dish.variants;
        }
      }

      let parsedAddons;
      if (dish.addons) {
        if (typeof dish.addons === "string") {
          try {
            parsedAddons = JSON.parse(dish.addons);
          } catch (e) {
            // ignore invalid
          }
        } else if (Array.isArray(dish.addons)) {
          parsedAddons = dish.addons;
        }
      }

      return {
        ...dish,
        meal_type: dish.meal_type || "veg",
        dish_price:
          Array.isArray(parsedVariants) && parsedVariants[0]
            ? Number(parsedVariants[0].price)
            : Number(dish.dish_price || 0),
        has_variants:
          Array.isArray(parsedVariants) ? parsedVariants.length > 1 : false,
        variants: Array.isArray(parsedVariants)
          ? parsedVariants.map((v) => ({
              size_name: v.size_name,
              price: v.price != null && v.price !== "" ? Number(v.price) : 0,
              extra: v.extra,
              is_available: v.is_available !== false,
            }))
          : undefined,
        addons: Array.isArray(parsedAddons)
          ? parsedAddons.map((a) => ({
              addon_name: a.addon_name,
              price: a.price != null && a.price !== "" ? Number(a.price) : 0,
              is_available: a.is_available !== false,
            }))
          : undefined,
      };
    });

    const isHideOnKot = typeof hide_on_kot === "string" ? hide_on_kot === "true" : !!hide_on_kot;

    const filter = { user_id, category };
    const existingMenu = await Menu.findOne(filter);

    let resultMenu;
    if (existingMenu) {
      const updatedDishes = [...existingMenu.dishes];

      parsedDishes.forEach((newDish) => {
        const existingIndex = updatedDishes.findIndex((d) => 
          (newDish._id && d._id.toString() === newDish._id.toString()) ||
          (d.dish_name.toLowerCase() === newDish.dish_name.toLowerCase())
        );

        if (existingIndex !== -1) {
          const existingDish = updatedDishes[existingIndex];
          updatedDishes[existingIndex] = {
            ...existingDish.toObject ? existingDish.toObject() : existingDish,
            ...newDish,
            _id: existingDish._id,
            dish_img: newDish.dish_img || existingDish.dish_img,
          };
        } else {
          updatedDishes.push(newDish);
        }
      });

      existingMenu.dishes = updatedDishes;
      existingMenu.counter = counter || existingMenu.counter;
      existingMenu.hide_on_kot = isHideOnKot;

      resultMenu = await existingMenu.save();
    } else {
      resultMenu = new Menu({
        user_id,
        category,
        counter: counter || null,
        hide_on_kot: isHideOnKot,
        dishes: parsedDishes,
      });
      await resultMenu.save();
    }

    res.status(200).json({
      success: true,
      message: "Menu saved",
      data: [resultMenu],
    });
  } catch (error) {
    console.error("Error adding menu:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const getMenuData = async (req, res) => {
  try {
    const query = { user_id: req.user };

    const projection = {
      category: 1,
      counter: 1,
      hide_on_kot: 1,
      dishes: 1,
      show_on_website: 1,
    };

    const menuData = await Menu.find(query).select(projection).lean();

    res.json({ success: true, data: menuData });
  } catch (error) {
    console.error("Error fetching menu data:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getMenuDataByResCode = async (req, res) => {
  try {
    const restaurant_code = req.params.res_code;

    const restaurant = await User.findOne({ restaurant_code })
      .select("_id, name")
      .lean();
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, error: "Restaurant not found" });
    }
    const user_id = restaurant._id;
    const restaurant_name = restaurant.name;

    const menuData = await Menu.find({ user_id }).lean();

    res.json({ success: true, data: menuData, restaurant_name });
  } catch (error) {
    console.error("Error fetching menu data:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getMenuDataByToken = async (req, res) => {
  try {
    const restaurant_token = req.params.token;

    const restaurant = await User.findOne({ restaurant_token })
      .select("_id name city logo")  // ← fix: space not comma, add city & logo for branding
      .lean();

    if (!restaurant) {
      return res.status(404).json({ success: false, error: "Restaurant not found" });
    }

    const menuData = await Menu.find({
      user_id: restaurant._id,
    }).lean();

    res.json({
      success: true,
      data: menuData,
      restaurant_name: restaurant.name,
      restaurant_city: restaurant.city || "",
      restaurant_logo: restaurant.logo || "",
    });

  } catch (error) {
    console.error("Error fetching menu data by token:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getMenuCategories = async (req, res) => {
  try {
    const userId = req.user;
    const { meal_type } = req.query;
    const filter = { user_id: userId };

    if (meal_type) {
      filter["dishes.meal_type"] = meal_type;
    }

    const categories = await Menu.distinct("category", filter);

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getMenuCounterOptions = async (req, res) => {
  try {
    const userId = req.user;

    const counters = await Menu.distinct("counter", {
      user_id: userId,
      counter: { $nin: [null, ""] },
    });

    res.json({ success: true, data: counters });
  } catch (error) {
    console.error("Error fetching counters:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getMenuSuggestions = async (req, res) => {
  try {
    const userId = req.user;
    const { types } = req.query;

    if (!types) {
      return res.status(400).json({
        success: false,
        message: "types query param is required",
      });
    }

    const typeList = types.split(",");
    const result = {};

    const promises = [];

    // CATEGORY suggestions
    if (typeList.includes("category")) {
      promises.push(
        Menu.distinct("category", {
          user_id: userId,
          category: { $nin: [null, ""] },
        }).then((data) => {
          result.categories = data.sort();
        }),
      );
    }

    // DISH NAME suggestions
    if (typeList.includes("dish")) {
      promises.push(
        Menu.distinct("dishes.dish_name", {
          user_id: userId,
          "dishes.dish_name": { $nin: [null, ""] },
        }).then((data) => {
          result.dishes = data.sort();
        }),
      );
    }

    await Promise.all(promises);

    res.json(result);
  } catch (error) {
    console.error("Menu suggestion error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load menu suggestions",
    });
  }
};

const getDishesByCategory = async (req, res) => {
  try {
    const userId = req.user;
    const { category } = req.query;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "category query param is required",
      });
    }

    const dishes = await Menu.distinct("dishes.dish_name", {
      user_id: userId,
      category: category,
      "dishes.dish_name": { $nin: [null, ""] },
    });

    res.json({
      success: true,
      data: dishes.sort(),
    });
  } catch (error) {
    console.error("Get dishes by category error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dishes",
    });
  }
};

const getMenuDataById = async (req, res) => {
  try {
    const dishId = req.params.id;
    const userId = req.user;

    const menu = await Menu.findOne(
      { user_id: userId, "dishes._id": dishId },
      { "dishes.$": 1 }, // only the matched dish
    ).lean();

    if (!menu || !menu.dishes || menu.dishes.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Dish not found" });
    }

    res.json({ success: true, data: menu.dishes[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateMenuCategoryAndMealType = async (req, res) => {
  try {
    const id = req.params.id;
    let { category, counter, hide_on_kot } = req.body;
    const userId = req.user;

    if (counter === "") {
      counter = null;
    }

    if (!hide_on_kot) {
      hide_on_kot = false;
    }

    const updatedMenu = await Menu.findOneAndUpdate(
      { user_id: userId, _id: id },
      { category, counter, hide_on_kot },
      { new: true },
    );

    res.json({ success: true, data: updatedMenu });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A menu category with this name already exists."
      });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateMenu = async (req, res) => {
  try {
    const {
      _id,
      dish_name,
      dish_price,
      description,
      quantity,
      unit,
      is_special,
      is_available,
      hide_on_kot,
      has_variants,
      variants,
      addons,
      meal_type,
    } = req.body;

    const userId = req.user;

    let parsedVariants;
    if (variants) {
      if (typeof variants === "string") {
        try {
          parsedVariants = JSON.parse(variants);
        } catch (e) {
          // ignore
        }
      } else if (Array.isArray(variants)) {
        parsedVariants = variants;
      }
    }

    let parsedAddons;
    if (addons) {
      if (typeof addons === "string") {
        try {
          parsedAddons = JSON.parse(addons);
        } catch (e) {
          // ignore
        }
      } else if (Array.isArray(addons)) {
        parsedAddons = addons;
      }
    }

    // Find the current menu document containing this dish
    const currentMenu = await Menu.findOne({ user_id: userId, "dishes._id": _id });
    if (!currentMenu) {
      return res.status(404).json({ success: false, message: "Dish not found" });
    }

    // Find the dish inside the current menu
    const currentDishIndex = currentMenu.dishes.findIndex(d => d._id.toString() === _id.toString());
    if (currentDishIndex === -1) {
      return res.status(404).json({ success: false, message: "Dish not found in menu" });
    }

    const currentDishObj = currentMenu.dishes[currentDishIndex].toObject ? currentMenu.dishes[currentDishIndex].toObject() : currentMenu.dishes[currentDishIndex];

    const updatedDishObj = {
      ...currentDishObj,
      dish_name: dish_name !== undefined ? dish_name : currentDishObj.dish_name,
      dish_price:
        Array.isArray(parsedVariants) && parsedVariants[0]
          ? Number(parsedVariants[0].price)
          : dish_price !== "" && dish_price != null
          ? Number(dish_price)
          : currentDishObj.dish_price,
      description: description !== undefined ? description : currentDishObj.description,
      is_special:
        is_special !== undefined
          ? typeof is_special === "string" ? is_special === "true" : !!is_special
          : currentDishObj.is_special,
      is_available:
        is_available !== undefined
          ? typeof is_available === "string" ? is_available === "true" : !!is_available
          : currentDishObj.is_available,
      has_variants:
        Array.isArray(parsedVariants) ? parsedVariants.length > 1 : currentDishObj.has_variants,
      variants: Array.isArray(parsedVariants)
        ? parsedVariants.map((v) => ({
            size_name: v.size_name,
            price: v.price != null && v.price !== "" ? Number(v.price) : 0,
            extra: v.extra,
            is_available: v.is_available !== false,
          }))
        : currentDishObj.variants,
      addons: Array.isArray(parsedAddons)
        ? parsedAddons.map((a) => ({
            addon_name: a.addon_name,
            price: a.price != null && a.price !== "" ? Number(a.price) : 0,
            is_available: a.is_available !== false,
          }))
        : currentDishObj.addons,
      meal_type: meal_type !== undefined ? meal_type : currentDishObj.meal_type || "veg",
    };

    if (req.file) {
      updatedDishObj.dish_img = "/menu/dishes/" + req.file.filename;
    }

    const updateFields = {};
    Object.keys(updatedDishObj).forEach(key => {
      if (key !== "_id") {
        updateFields[`dishes.$.${key}`] = updatedDishObj[key];
      }
    });

    const result = await Menu.updateOne(
      { user_id: userId, "dishes._id": _id },
      { $set: updateFields }
    );

    // Update hide_on_kot at the menu (category) level if provided
    if (hide_on_kot !== undefined && hide_on_kot !== null) {
      const isHideOnKot = typeof hide_on_kot === "string" ? hide_on_kot === "true" : !!hide_on_kot;
      await Menu.updateOne(
        { user_id: userId, "dishes._id": _id },
        { $set: { hide_on_kot: isHideOnKot } },
      );
    }

    res.json({ success: true, message: "Dish updated", result });
  } catch (error) {
    console.error("Error updating menu:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const deleteMenu = async (req, res) => {
  try {
    const userId = req.user;
    const dishId = req.params.id;

    const menu = await Menu.findOne(
      { user_id: userId, "dishes._id": dishId },
      { category: 1, dishes: 1 }, // projection
    );

    if (!menu) {
      return res.status(404).json({ message: "Dish not found" });
    }

    const dishToDelete = menu.dishes.find(
      (dish) => dish._id.toString() === dishId,
    );
    if (!dishToDelete) {
      return res.status(404).json({ message: "Dish not found" });
    }

    // Delete dish image if exists
    if (dishToDelete.dish_img) {
      // dish_img = "/menu/dishes/filename"
      const filename = path.basename(dishToDelete.dish_img);
      const imagePath = path.join(
        __dirname,
        "../uploads/menu/dishes",
        filename,
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log("Deleted image file:", imagePath);
      }
    }

    const updateResult = await Menu.updateOne(
      { user_id: userId, "dishes._id": dishId },
      { $pull: { dishes: { _id: dishId } } },
    );

    if (updateResult.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "Dish not found or already deleted" });
    }

    // Delete empty menu documents for that category
    const updatedMenu = await Menu.findOne({
      user_id: userId,
      category: menu.category,
    }).select("dishes");

    if (updatedMenu && updatedMenu.dishes.length === 0) {
      await Menu.deleteOne({
        user_id: userId,
        category: menu.category,
      });
    }

    res.json({ success: true, message: "Dish deleted successfully" });
  } catch (error) {
    console.error("Error in delete Menu:", error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};

module.exports = {
  addMenu,
  getMenuData,
  getMenuDataById,
  getMenuDataByResCode,
  getMenuDataByToken,
  getMenuCategories,
  getMenuCounterOptions,
  getMenuSuggestions,
  getDishesByCategory,
  updateMenuCategoryAndMealType,
  updateMenu,
  deleteMenu,
};
