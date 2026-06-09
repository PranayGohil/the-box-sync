require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const Menu = require("../models/menuModel");
const connectDB = require("../utils/db");

const runMigration = async () => {
  console.log("Connecting to database...");
  await connectDB();

  console.log("Starting menu meal_type migration...");

  try {
    const menus = await Menu.find({});
    console.log(`Found ${menus.length} menu documents to process.`);

    const groups = {};
    for (const menu of menus) {
      const userId = menu.user_id || "";
      const category = (menu.category || "").trim();
      const key = `${userId}:::${category.toLowerCase()}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(menu);
    }

    console.log(`Grouped into ${Object.keys(groups).length} unique user-category combinations.`);

    let migratedMenusCount = 0;
    let deletedMenusCount = 0;

    for (const [key, menuList] of Object.entries(groups)) {
      if (menuList.length === 0) continue;

      const mainMenu = menuList[0];
      const combinedDishes = [];

      for (const m of menuList) {
        if (m.dishes && Array.isArray(m.dishes)) {
          m.dishes.forEach((dish) => {
            const plainDish = dish.toObject ? dish.toObject() : dish;
            plainDish.meal_type = plainDish.meal_type || m.meal_type || "veg";
            
            const exists = combinedDishes.some(d => d.dish_name.toLowerCase() === plainDish.dish_name.toLowerCase());
            if (!exists) {
              combinedDishes.push(plainDish);
            }
          });
        }
      }

      mainMenu.dishes = combinedDishes;
      mainMenu.markModified("dishes");
      
      await mainMenu.save();
      migratedMenusCount++;

      for (let i = 1; i < menuList.length; i++) {
        await Menu.deleteOne({ _id: menuList[i]._id });
        deletedMenusCount++;
      }
    }

    console.log(`Saved ${migratedMenusCount} merged menus, deleted ${deletedMenusCount} redundant duplicate category documents.`);

    try {
      console.log("Dropping old unique index user_id_1_category_1_meal_type_1...");
      await mongoose.connection.db.collection("menus").dropIndex("user_id_1_category_1_meal_type_1");
      console.log("Dropped user_id_1_category_1_meal_type_1 index.");
    } catch (e) {
      console.log("Index user_id_1_category_1_meal_type_1 did not exist or could not be dropped:", e.message);
    }

    try {
      console.log("Dropping old non-unique index user_id_1_category_1...");
      await mongoose.connection.db.collection("menus").dropIndex("user_id_1_category_1");
      console.log("Dropped user_id_1_category_1 index.");
    } catch (e) {
      console.log("Index user_id_1_category_1 did not exist or could not be dropped:", e.message);
    }

    console.log("Migration completed successfully!");

  } catch (error) {
    console.error("Migration failed with error:", error);
  } finally {
    console.log("Disconnecting from database...");
    await mongoose.disconnect();
    console.log("Database disconnected.");
  }
};

runMigration();
