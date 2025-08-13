const Order = require("../models/orderModel");
const Menu = require("../models/menuModel");

const getDashboardData = async (req, res) => {
    try {
        const restaurantId = req.user._id; // from logged in user
        console.log("restaurantId : ", restaurantId);
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Today's orders grouped by type
        const todayOrdersArray = await Order.aggregate([
            { $match: { restaurant_id: restaurantId, order_date: { $gte: startOfDay, $lte: endOfDay } } },
            { $group: { _id: "$order_type", total: { $sum: 1 } } }
        ]);

        // Convert array to object
        const TodayTotalOrderTypeWiseOrders = todayOrdersArray.reduce((acc, curr) => {
            acc[curr._id] = curr.total;
            return acc;
        }, {});

        // Last 7 days revenue
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);

        const LastWeekTotalRevenue = await Order.aggregate([
            { $match: { restaurant_id: restaurantId, order_date: { $gte: sevenDaysAgo, $lte: today } } },
            {
                $group: {
                    _id: {
                        day: { $dayOfMonth: "$order_date" },
                        month: { $month: "$order_date" },
                        year: { $year: "$order_date" }
                    },
                    totalRevenue: { $sum: "$total_amount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ]);

        // Most selling dishes with category & special flag
        const MostSellingDishes = await Order.aggregate([
            { $match: { restaurant_id: restaurantId } },
            { $unwind: "$order_items" },

            // normalize the order dish name
            {
                $addFields: {
                    normalizedDishName: {
                        $toLower: { $trim: { input: "$order_items.dish_name" } }
                    }
                }
            },

            {
                $lookup: {
                    from: "menus", // matches mongoose.model("menu") => "menus"
                    let: { n: "$normalizedDishName" },
                    pipeline: [
                        { $match: { restaurant_id: restaurantId } }, // same restaurant
                        { $unwind: "$dishes" },
                        {
                            $addFields: {
                                normalizedDishName: {
                                    $toLower: { $trim: { input: "$dishes.dish_name" } }
                                }
                            }
                        },
                        { $match: { $expr: { $eq: ["$normalizedDishName", "$$n"] } } },
                        { $project: { category: 1, is_special: "$dishes.is_special" } }
                    ],
                    as: "dishDetails"
                }
            },

            // pick first matched menu detail (if any)
            {
                $addFields: {
                    category: { $arrayElemAt: ["$dishDetails.category", 0] },
                    isSpecial: { $arrayElemAt: ["$dishDetails.is_special", 0] }
                }
            },

            {
                $group: {
                    _id: "$normalizedDishName",
                    dishName: { $first: "$order_items.dish_name" },
                    totalSold: { $sum: "$order_items.quantity" },
                    category: { $first: "$category" },
                    isSpecial: { $first: "$isSpecial" }
                }
            },

            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);

        res.status(200).json({
            TodayTotalOrderTypeWiseOrders,
            LastWeekTotalRevenue,
            MostSellingDishes
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};


module.exports = { getDashboardData };