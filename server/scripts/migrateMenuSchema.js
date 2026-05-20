require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const Menu = require("../models/menuModel");
const connectDB = require("../utils/db");

const runMigration = async () => {
  console.log("Connecting to database...");
  await connectDB();

  console.log("Starting menu collection migration...");

  try {
    const menus = await Menu.find({});
    console.log(`Found ${menus.length} menu documents to migrate.`);

    let migratedMenusCount = 0;
    let migratedDishesCount = 0;

    for (const menu of menus) {
      let isModified = false;

      if (!menu.dishes || !Array.isArray(menu.dishes)) {
        continue;
      }

      const updatedDishes = menu.dishes.map((dish) => {
        let updatedVariants = [];

        // Check if there are existing variants
        if (Array.isArray(dish.variants) && dish.variants.length > 0) {
          updatedVariants = dish.variants.map((v) => ({
            size_name: v.size_name || "",
            price: typeof v.price === "number" ? v.price : Number(v.price || 0),
            extra: v.extra || "",
            is_available: v.is_available !== false,
          }));
        } else {
          // If no variants exist, create a default variant based on the top-level dish_price
          const price = typeof dish.dish_price === "number" ? dish.dish_price : Number(dish.dish_price || 0);
          updatedVariants = [
            {
              size_name: "",
              price: price,
              extra: "",
              is_available: dish.is_available !== false,
            },
          ];
        }

        // Under the hood calculations
        const hasVariants = updatedVariants.length > 1;
        const dishPrice = updatedVariants[0] ? updatedVariants[0].price : 0;

        migratedDishesCount++;
        isModified = true;

        // Convert the mongoose subdocument to a plain object first
        const plainDish = dish.toObject ? dish.toObject() : dish;

        // Strip quantity and unit out
        delete plainDish.quantity;
        delete plainDish.unit;

        return {
          ...plainDish,
          dish_price: dishPrice,
          has_variants: hasVariants,
          variants: updatedVariants,
        };
      });

      if (isModified) {
        menu.dishes = updatedDishes;
        
        // Use markModified to let Mongoose know the nested dishes array changed
        menu.markModified("dishes");
        
        await menu.save();
        migratedMenusCount++;
        console.log(`Migrated menu category "${menu.category}" - ${updatedDishes.length} dishes updated.`);
      }
    }

    console.log("\nMigration completed successfully!");
    console.log(`Migrated Menus: ${migratedMenusCount}`);
    console.log(`Migrated Dishes: ${migratedDishesCount}`);

  } catch (error) {
    console.error("Migration failed with error:", error);
  } finally {
    console.log("Disconnecting from database...");
    await mongoose.disconnect();
    console.log("Database disconnected.");
  }
};

runMigration();
