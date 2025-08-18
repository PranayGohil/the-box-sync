const fs = require("fs");
const path = require("path");
const Menu = require("../models/menuModel");

const addMenu = async (req, res) => {
  try {
    const restaurant_id = req.user;
    const { category, meal_type, dishes } = req.body;

    if (!category || !meal_type || !Array.isArray(JSON.parse(dishes))) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const parsedDishes =
      typeof dishes === "string" ? JSON.parse(dishes) : dishes;

    // Attach uploaded image path as string to each dish
    const uploadedImages = req.files?.dish_img || [];

    uploadedImages.forEach((file, index) => {
      if (parsedDishes[index]) {
        parsedDishes[index].dish_img = "/menu/dishes/" + file.filename;
      }
    });

    const menuData = {
      category,
      meal_type,
      restaurant_id,
    };

    // Check if menu already exists
    const existingMenu = await Menu.findOne({
      category,
      meal_type,
      restaurant_id,
    });

    if (existingMenu) {
      existingMenu.dishes.push(...parsedDishes);
      await existingMenu.save();
      return res
        .status(200)
        .json({ message: "Menu updated", data: existingMenu });
    } else {
      const newMenu = new Menu({
        ...menuData,
        dishes: parsedDishes,
      });
      await newMenu.save();
      return res.status(201).json({ message: "Menu created", data: newMenu });
    }
  } catch (error) {
    console.error("Error adding menu:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const getMenuData = async (req, res) => {
  try {
    const query = { restaurant_id: req.user };
    console.log("Query : ", query);
    const menuData = await Menu.find(query);
    console.log("Menu Data : ", menuData);
    res.json({ data: menuData });
  } catch (error) {
    console.error("Error fetching menu data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// const getMenuDataByResCode = async (req, res) => {
//   try {

//     const query = ;

//     if (mealType) {
//       query.meal_type = mealType;
//     }

//     if (category) {
//       query.category = category;
//     }

//     if (searchText) {
//       query["dishes.dish_name"] = { $regex: searchText, $options: "i" };
//     }

//     const menuData = await Menu.find(query);
//     res.json(menuData);
//   } catch (error) {
//     console.error("Error fetching menu data:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

const getMenuCategories = async (req, res) => {
  try {
    // Retrieve unique category names
    const categories = await Menu.distinct("category", {
      restaurant_id: req.user,
    });
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
const getMenuDataById = (req, res) => {
  try {
    const dishId = req.params.id;

    Menu.findOne({ "dishes._id": dishId })
      .then((data) => {
        const dish = data.dishes.find((d) => d._id.toString() === dishId);
        res.json(dish);
      })
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
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
    console.log("Update Menu Data:", req.body);

    const updateFields = {
      "dishes.$.dish_name": dish_name,
      "dishes.$.dish_price": dish_price,
      "dishes.$.description": description,
      "dishes.$.quantity": quantity,
      "dishes.$.unit": unit,
      "dishes.$.is_special": is_special === "true",
      "dishes.$.is_available": is_available === "true",
    };

    if (req.file) {
      // Use only the filename (clean path), multer already saved it under /uploads/menu/dishes
      updateFields["dishes.$.dish_img"] = "/menu/dishes/" + req.file.filename;
    }

    const result = await Menu.updateOne(
      { "dishes._id": _id },
      { $set: updateFields }
    );

    console.log("Update Result:", result);
    res.json({ success: true, message: "Dish updated", result });
  } catch (error) {
    console.error("Error updating menu:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const deleteMenu = async (req, res) => {
  try {
    console.log("User : " + req.user);
    const dishId = req.params.id;

    // Find the document containing the dish
    const dishData = await Menu.findOne({ "dishes._id": dishId });
    if (!dishData) {
      return res.status(404).json({ message: "Dish not found" });
    }

    // Find the dish object
    const dishToDelete = dishData.dishes.find(
      (dish) => dish._id.toString() === dishId
    );
    if (!dishToDelete) {
      return res.status(404).json({ message: "Dish not found" });
    }

    // Delete dish image if exists
    if (dishToDelete.image) {
      const imagePath = path.join(
        __dirname,
        "../uploads/menu/dishes",
        dishToDelete.image
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log("Deleted image file:", imagePath);
      }
    }

    // Remove the dish from the dishes array
    const updateResult = await Menu.updateOne(
      { "dishes._id": dishId },
      { $pull: { dishes: { _id: dishId } } }
    );

    if (updateResult.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "Dish not found or already deleted" });
    }

    // Check if any dishes remain in the same category + meal_type
    const category = dishData.category;
    const meal_type = dishData.meal_type;

    const updatedMenu = await Menu.findOne({
      category,
      meal_type,
      restaurant_id: req.user,
    });

    if (updatedMenu && updatedMenu.dishes.length === 0) {
      await Menu.deleteOne({ category, meal_type, restaurant_id: req.user });
    }

    res.json({ message: "Dish deleted successfully" });
  } catch (error) {
    console.error("Error in delete Menu:", error);
    res.status(500).send("An error occurred");
  }
};

const setSpecialMenu = (req, res) => {
  try {
    console.log(req.params.id);
    const dishId = req.params.id;
    Menu.updateOne(
      { "dishes._id": dishId },
      {
        $set: {
          "dishes.$.is_special": true,
        },
      }
    )
      .then((data) => {
        console.log(data);
        res.json(data);
      })
      .catch((err) => res.json(err));
  } catch {
    console.log(error);
    res.status(500).send("An error occurred");
  }
};

const removeSpecialMenu = (req, res) => {
  try {
    console.log(req.params.id);
    const dishId = req.params.id;
    Menu.updateOne(
      { "dishes._id": dishId },
      {
        $set: {
          "dishes.$.is_special": false,
        },
      }
    )
      .then((data) => {
        console.log(data);
        res.json(data);
      })
      .catch((err) => res.json(err));
  } catch {
    console.log(error);
    res.status(500).send("An error occurred");
  }
};

const updateDishAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_available } = req.body;

    // Find the dish and update its availability
    const updatedMenu = await Menu.updateOne(
      { "dishes._id": id },
      { $set: { "dishes.$.is_available": is_available } }
    );

    if (updatedMenu.modifiedCount > 0) {
      res.status(200).json({ message: "Dish availability updated" });
    } else {
      res.status(404).json({ message: "Dish not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  addMenu,
  getMenuData,
  getMenuDataById,
  getMenuCategories,
  updateMenu,
  deleteMenu,
  setSpecialMenu,
  removeSpecialMenu,
  updateDishAvailability,
};
