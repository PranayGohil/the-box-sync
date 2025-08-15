const Order = require("../models/orderModel");
const Menu = require("../models/menuModel");
const mongoose = require("mongoose");

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
        today.setHours(23, 59, 59, 999);

        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);

        const LastWeekTotalRevenueRaw = await Order.aggregate([
            {
                $match: {
                    restaurant_id: restaurantId,
                    order_date: { $gte: sevenDaysAgo, $lte: today }
                }
            },
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

        // Build full 7-day list
        let LastWeekTotalRevenue = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(sevenDaysAgo);
            date.setDate(sevenDaysAgo.getDate() + i);

            const found = LastWeekTotalRevenueRaw.find(item =>
                item._id.day === date.getDate() &&
                item._id.month === (date.getMonth() + 1) &&
                item._id.year === date.getFullYear()
            );
            console.log("Found : ", found, " Date : ", date);

            LastWeekTotalRevenue.push({
                _id: {
                    day: date.getDate(),
                    month: date.getMonth() + 1,
                    year: date.getFullYear()
                },
                totalRevenue: found ? found.totalRevenue : 0
            });
        }

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

const getCategoryWiseOrders = async (req, res) => {
    try {
        const restaurantId = req.user._id; // or req.params.id
        const pipeline = [
            { $match: { restaurant_id: restaurantId } },
            { $unwind: "$order_items" },
            // Lookup to get category from Menu
            {
                $lookup: {
                    from: "menus",
                    localField: "order_items.dish_name",
                    foreignField: "dishes.dish_name",
                    as: "menu_info"
                }
            },
            { $unwind: "$menu_info" },
            { $group: { _id: "$menu_info.category", totalOrders: { $sum: "$order_items.quantity" } } },
            { $project: { category: "$_id", totalOrders: 1, _id: 0 } }
        ];

        const result = await Order.aggregate(pipeline);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
};

const getOrderTypeWiseOrders = async (req, res) => {
    try {
        const restaurantId = req.user._id;

        const result = await Order.aggregate([
            { $match: { restaurant_id: restaurantId } },
            { $group: { _id: "$order_type", totalOrders: { $sum: 1 } } },
            { $project: { orderType: "$_id", totalOrders: 1, _id: 0 } }
        ]);

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
};

const getRevenueSummary = async (req, res) => {
    try {
        const { duration } = req.query; // 'week' | 'month' | 'year'
        const restaurantId = req.user._id;

        let startDate;
        const now = new Date();
        if (duration === 'week') {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 6); // last 7 days
        } else if (duration === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (duration === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1);
        } else {
            return res.status(400).json({ error: "Invalid duration" });
        }

        const result = await Order.aggregate([
            { $match: { restaurant_id: restaurantId, order_date: { $gte: startDate, $lte: now } } },
            {
                $group: {
                    _id: {
                        year: { $year: "$order_date" },
                        month: { $month: "$order_date" },
                        day: { $dayOfMonth: "$order_date" }
                    },
                    totalRevenue: { $sum: "$total_amount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ]);

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
};

module.exports = { getDashboardData, getCategoryWiseOrders, getOrderTypeWiseOrders, getRevenueSummary };