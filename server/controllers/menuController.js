const fs = require("fs");
const path = require("path");
const Menu = require("../models/menuModel");
const User = require("../models/userModel");

const addMenu = async (req, res) => {
  try {
    const user_id = req.user;
    let { category, meal_type, dishes } = req.body;

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
      !meal_type ||
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

    parsedDishes = parsedDishes.map((dish) => ({
      ...dish,
      dish_price:
        dish.dish_price !== "" && dish.dish_price != null
          ? Number(dish.dish_price)
          : undefined,
      quantity:
        dish.quantity !== "" && dish.quantity != null
          ? Number(dish.quantity)
          : undefined,
    }));

    const filter = { user_id, category, meal_type };

    const update = {
      $push: { dishes: { $each: parsedDishes } },
    };

    const options = {
      new: true,
      upsert: true, // create if not exists
    };

    const updatedMenu = await Menu.findOneAndUpdate(filter, update, options);

    const isNew = updatedMenu.isNew; // not directly available; if needed, you can check via separate flag logic

    res.status(200).json({
      success: true,
      message: "Menu saved",
      data: updatedMenu,
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
      meal_type: 1,
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
      .select("_id")
      .lean();
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, error: "Restaurant not found" });
    }
    const user_id = restaurant._id;

    const menuData = await Menu.find({ user_id }).lean();

    res.json({ success: true, data: menuData });
  } catch (error) {
    console.error("Error fetching menu data:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getMenuCategories = async (req, res) => {
  try {
    const categories = await Menu.distinct("category", {
      user_id: req.user,
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getMenuDataById = async (req, res) => {
  try {
    const dishId = req.params.id;
    const userId = req.user;

    const menu = await Menu.findOne(
      { user_id: userId, "dishes._id": dishId },
      { "dishes.$": 1 } // only the matched dish
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
    } = req.body;

    const userId = req.user;

    const updateFields = {
      "dishes.$.dish_name": dish_name,
      "dishes.$.dish_price":
        dish_price !== "" && dish_price != null
          ? Number(dish_price)
          : undefined,
      "dishes.$.description": description,
      "dishes.$.quantity":
        quantity !== "" && quantity != null ? Number(quantity) : undefined,
      "dishes.$.unit": unit,
      "dishes.$.is_special":
        typeof is_special === "string" ? is_special === "true" : !!is_special,
      "dishes.$.is_available":
        typeof is_available === "string"
          ? is_available === "true"
          : !!is_available,
    };

    if (req.file) {
      updateFields["dishes.$.dish_img"] = "/menu/dishes/" + req.file.filename;
    }

    Object.keys(updateFields).forEach(
      (key) => updateFields[key] === undefined && delete updateFields[key]
    );

    const result = await Menu.updateOne(
      { user_id: userId, "dishes._id": _id },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Dish not found" });
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
      { category: 1, meal_type: 1, dishes: 1 } // projection
    );

    if (!menu) {
      return res.status(404).json({ message: "Dish not found" });
    }

    const dishToDelete = menu.dishes.find(
      (dish) => dish._id.toString() === dishId
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
        filename
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log("Deleted image file:", imagePath);
      }
    }

    const updateResult = await Menu.updateOne(
      { user_id: userId, "dishes._id": dishId },
      { $pull: { dishes: { _id: dishId } } }
    );

    if (updateResult.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "Dish not found or already deleted" });
    }

    // Delete empty menu documents for that category + meal_type
    const updatedMenu = await Menu.findOne({
      user_id: userId,
      category: menu.category,
      meal_type: menu.meal_type,
    }).select("dishes");

    if (updatedMenu && updatedMenu.dishes.length === 0) {
      await Menu.deleteOne({
        user_id: userId,
        category: menu.category,
        meal_type: menu.meal_type,
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
  getMenuCategories,
  updateMenu,
  deleteMenu,
};
