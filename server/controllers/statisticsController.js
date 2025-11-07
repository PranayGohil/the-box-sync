const Order = require("../models/orderModel");
const Menu = require("../models/menuModel");
const Customer = require("../models/customerModel");
const mongoose = require("mongoose");

// ============================================
// UTILITY FUNCTIONS
// ============================================

const getDateRange = (period, customStart = null, customEnd = null) => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    let startDate = new Date();

    switch (period) {
        case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'yesterday':
            startDate.setDate(now.getDate() - 1);
            startDate.setHours(0, 0, 0, 0);
            now.setDate(now.getDate() - 1);
            break;
        case 'week':
            startDate.setDate(now.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'last_month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            endOfLastMonth.setHours(23, 59, 59, 999);
            return { startDate, endDate: endOfLastMonth };
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'custom':
            if (!customStart || !customEnd) {
                throw new Error("Custom date range requires start and end dates");
            }
            startDate = new Date(customStart);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(customEnd);
            endDate.setHours(23, 59, 59, 999);
            return { startDate, endDate };
        default:
            startDate.setHours(0, 0, 0, 0);
    }

    return { startDate, endDate: now };
};

const fillMissingDates = (data, startDate, endDate, groupBy = 'day') => {
    const result = [];
    const current = new Date(startDate);

    while (current <= endDate) {
        const found = data.find(item => {
            if (groupBy === 'day') {
                return item._id.day === current.getDate() &&
                    item._id.month === (current.getMonth() + 1) &&
                    item._id.year === current.getFullYear();
            } else if (groupBy === 'month') {
                return item._id.month === (current.getMonth() + 1) &&
                    item._id.year === current.getFullYear();
            }
            return false;
        });

        result.push({
            _id: {
                day: groupBy === 'day' ? current.getDate() : undefined,
                month: current.getMonth() + 1,
                year: current.getFullYear()
            },
            value: found ? found.value : 0
        });

        if (groupBy === 'day') {
            current.setDate(current.getDate() + 1);
        } else {
            current.setMonth(current.getMonth() + 1);
        }
    }

    return result;
};

// ============================================
// REVENUE ANALYTICS
// ============================================

const getRevenueStats = async (req, res) => {
    try {
        const restaurantId = req.user._id;
        const { period = 'today', start_date, end_date, group_by = 'day' } = req.query;

        const { startDate, endDate } = getDateRange(period, start_date, end_date);

        const pipeline = [
            {
                $match: {
                    user_id: restaurantId,
                    order_date: { $gte: startDate, $lte: endDate }
                }
            }
        ];

        // Group by time period
        if (group_by === 'day') {
            pipeline.push({
                $group: {
                    _id: {
                        day: { $dayOfMonth: "$order_date" },
                        month: { $month: "$order_date" },
                        year: { $year: "$order_date" }
                    },
                    value: { $sum: "$total_amount" },
                    orderCount: { $sum: 1 }
                }
            });
        } else if (group_by === 'month') {
            pipeline.push({
                $group: {
                    _id: {
                        month: { $month: "$order_date" },
                        year: { $year: "$order_date" }
                    },
                    value: { $sum: "$total_amount" },
                    orderCount: { $sum: 1 }
                }
            });
        } else if (group_by === 'hour') {
            pipeline.push({
                $group: {
                    _id: {
                        hour: { $hour: "$order_date" },
                        day: { $dayOfMonth: "$order_date" },
                        month: { $month: "$order_date" },
                        year: { $year: "$order_date" }
                    },
                    value: { $sum: "$total_amount" },
                    orderCount: { $sum: 1 }
                }
            });
        }

        pipeline.push({ $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } });

        const data = await Order.aggregate(pipeline);

        // Fill missing dates for better visualization
        const filledData = group_by !== 'hour' ?
            fillMissingDates(data, startDate, endDate, group_by) : data;

        // Calculate summary
        const totalRevenue = filledData.reduce((sum, item) => sum + item.value, 0);
        const totalOrders = filledData.reduce((sum, item) => sum + (item.orderCount || 0), 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        res.status(200).json({
            success: true,
            period,
            groupBy: group_by,
            summary: {
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                totalOrders,
                averageOrderValue: Math.round(averageOrderValue * 100) / 100
            },
            data: filledData
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================
// ORDER ANALYTICS
// ============================================

const getOrderStats = async (req, res) => {
    try {
        const restaurantId = req.user._id;
        const { period = 'today', start_date, end_date, group_by = 'status' } = req.query;

        const { startDate, endDate } = getDateRange(period, start_date, end_date);

        let groupField;
        switch (group_by) {
            case 'type':
                groupField = "$order_type";
                break;
            case 'status':
                groupField = "$order_status";
                break;
            case 'source':
                groupField = "$order_source";
                break;
            case 'payment':
                groupField = "$payment_type";
                break;
            default:
                groupField = "$order_status";
        }

        const result = await Order.aggregate([
            {
                $match: {
                    user_id: restaurantId,
                    order_date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: groupField,
                    count: { $sum: 1 },
                    totalRevenue: { $sum: "$total_amount" },
                    avgOrderValue: { $avg: "$total_amount" }
                }
            },
            {
                $project: {
                    category: "$_id",
                    count: 1,
                    totalRevenue: { $round: ["$totalRevenue", 2] },
                    avgOrderValue: { $round: ["$avgOrderValue", 2] },
                    _id: 0
                }
            },
            { $sort: { count: -1 } }
        ]);

        const totalOrders = result.reduce((sum, item) => sum + item.count, 0);

        res.status(200).json({
            success: true,
            period,
            groupBy: group_by,
            totalOrders,
            data: result
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================
// DISH/MENU ANALYTICS
// ============================================

const getTopDishes = async (req, res) => {
    try {
        const restaurantId = req.user._id;
        const { period = 'week', start_date, end_date, limit = 10, category } = req.query;

        const { startDate, endDate } = getDateRange(period, start_date, end_date);

        const matchStage = {
            user_id: restaurantId,
            order_date: { $gte: startDate, $lte: endDate }
        };

        const pipeline = [
            { $match: matchStage },
            { $unwind: "$order_items" },
            {
                $addFields: {
                    normalizedDishName: {
                        $toLower: { $trim: { input: "$order_items.dish_name" } }
                    }
                }
            },
            {
                $lookup: {
                    from: "menus",
                    let: { dishName: "$normalizedDishName" },
                    pipeline: [
                        { $match: { user_id: restaurantId } },
                        { $unwind: "$dishes" },
                        {
                            $addFields: {
                                normalizedMenuDish: {
                                    $toLower: { $trim: { input: "$dishes.dish_name" } }
                                }
                            }
                        },
                        {
                            $match: {
                                $expr: { $eq: ["$normalizedMenuDish", "$$dishName"] }
                            }
                        },
                        {
                            $project: {
                                category: 1,
                                meal_type: 1,
                                is_special: "$dishes.is_special",
                                dish_price: "$dishes.dish_price",
                                dish_img: "$dishes.dish_img"
                            }
                        }
                    ],
                    as: "menuInfo"
                }
            },
            {
                $addFields: {
                    menuDetail: { $arrayElemAt: ["$menuInfo", 0] }
                }
            }
        ];

        // Add category filter if provided
        if (category) {
            pipeline.push({
                $match: { "menuDetail.category": category }
            });
        }

        pipeline.push(
            {
                $group: {
                    _id: "$normalizedDishName",
                    dishName: { $first: "$order_items.dish_name" },
                    totalQuantity: { $sum: "$order_items.quantity" },
                    totalRevenue: { $sum: { $multiply: ["$order_items.quantity", "$order_items.dish_price"] } },
                    orderCount: { $sum: 1 },
                    category: { $first: "$menuDetail.category" },
                    mealType: { $first: "$menuDetail.meal_type" },
                    isSpecial: { $first: "$menuDetail.is_special" },
                    avgPrice: { $avg: "$order_items.dish_price" },
                    dishImg: { $first: "$menuDetail.dish_img" }
                }
            },
            {
                $project: {
                    dishName: 1,
                    totalQuantity: 1,
                    totalRevenue: { $round: ["$totalRevenue", 2] },
                    orderCount: 1,
                    category: 1,
                    mealType: 1,
                    isSpecial: 1,
                    avgPrice: { $round: ["$avgPrice", 2] },
                    dishImg: 1,
                    _id: 0
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: parseInt(limit) }
        );

        const result = await Order.aggregate(pipeline);

        res.status(200).json({
            success: true,
            period,
            limit: parseInt(limit),
            category: category || 'all',
            data: result
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const getCategoryStats = async (req, res) => {
    try {
        const restaurantId = req.user._id;
        const { period = 'week', start_date, end_date } = req.query;

        const { startDate, endDate } = getDateRange(period, start_date, end_date);

        const result = await Order.aggregate([
            {
                $match: {
                    user_id: restaurantId,
                    order_date: { $gte: startDate, $lte: endDate }
                }
            },
            { $unwind: "$order_items" },
            {
                $addFields: {
                    normalizedDishName: {
                        $toLower: { $trim: { input: "$order_items.dish_name" } }
                    }
                }
            },
            {
                $lookup: {
                    from: "menus",
                    let: { dishName: "$normalizedDishName" },
                    pipeline: [
                        { $match: { user_id: restaurantId } },
                        { $unwind: "$dishes" },
                        {
                            $addFields: {
                                normalizedMenuDish: {
                                    $toLower: { $trim: { input: "$dishes.dish_name" } }
                                }
                            }
                        },
                        {
                            $match: {
                                $expr: { $eq: ["$normalizedMenuDish", "$$dishName"] }
                            }
                        },
                        { $project: { category: 1 } }
                    ],
                    as: "menuInfo"
                }
            },
            {
                $addFields: {
                    category: { $arrayElemAt: ["$menuInfo.category", 0] }
                }
            },
            {
                $group: {
                    _id: "$category",
                    totalQuantity: { $sum: "$order_items.quantity" },
                    totalRevenue: { $sum: { $multiply: ["$order_items.quantity", "$order_items.dish_price"] } },
                    orderCount: { $sum: 1 },
                    uniqueDishes: { $addToSet: "$normalizedDishName" }
                }
            },
            {
                $project: {
                    category: "$_id",
                    totalQuantity: 1,
                    totalRevenue: { $round: ["$totalRevenue", 2] },
                    orderCount: 1,
                    uniqueDishCount: { $size: "$uniqueDishes" },
                    _id: 0
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        const totalRevenue = result.reduce((sum, item) => sum + item.totalRevenue, 0);

        // Add percentage
        const dataWithPercentage = result.map(item => ({
            ...item,
            revenuePercentage: totalRevenue > 0 ?
                Math.round((item.totalRevenue / totalRevenue) * 100 * 100) / 100 : 0
        }));

        res.status(200).json({
            success: true,
            period,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            data: dataWithPercentage
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================
// CUSTOMER ANALYTICS
// ============================================

const getCustomerStats = async (req, res) => {
    try {
        const restaurantId = req.user._id;
        const { period = 'month', start_date, end_date } = req.query;

        const { startDate, endDate } = getDateRange(period, start_date, end_date);

        // Top customers by revenue
        const topCustomers = await Order.aggregate([
            {
                $match: {
                    user_id: restaurantId,
                    order_date: { $gte: startDate, $lte: endDate },
                    customer_id: { $exists: true, $ne: null, $ne: "" }
                }
            },
            {
                $group: {
                    _id: "$customer_id",
                    customerName: { $first: "$customer_name" },
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: "$total_amount" },
                    avgOrderValue: { $avg: "$total_amount" },
                    lastOrderDate: { $max: "$order_date" }
                }
            },
            {
                $project: {
                    customerId: "$_id",
                    customerName: 1,
                    totalOrders: 1,
                    totalSpent: { $round: ["$totalSpent", 2] },
                    avgOrderValue: { $round: ["$avgOrderValue", 2] },
                    lastOrderDate: 1,
                    _id: 0
                }
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 10 }
        ]);

        // Customer acquisition trend
        const newCustomers = await Customer.aggregate([
            {
                $match: {
                    user_id: restaurantId
                }
            },
            {
                $lookup: {
                    from: "orders",
                    let: { customerId: { $toString: "$_id" } },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$customer_id", "$$customerId"] },
                                user_id: restaurantId
                            }
                        },
                        { $sort: { order_date: 1 } },
                        { $limit: 1 }
                    ],
                    as: "firstOrder"
                }
            },
            { $unwind: { path: "$firstOrder", preserveNullAndEmptyArrays: true } },
            {
                $match: {
                    "firstOrder.order_date": { $gte: startDate, $lte: endDate }
                }
            },
            { $count: "count" }
        ]);

        // Repeat customer rate
        const repeatCustomers = await Order.aggregate([
            {
                $match: {
                    user_id: restaurantId,
                    order_date: { $gte: startDate, $lte: endDate },
                    customer_id: { $exists: true, $ne: null, $ne: "" }
                }
            },
            {
                $group: {
                    _id: "$customer_id",
                    orderCount: { $sum: 1 }
                }
            },
            {
                $match: {
                    orderCount: { $gt: 1 }
                }
            },
            { $count: "count" }
        ]);

        const totalUniqueCustomers = await Order.aggregate([
            {
                $match: {
                    user_id: restaurantId,
                    order_date: { $gte: startDate, $lte: endDate },
                    customer_id: { $exists: true, $ne: null, $ne: "" }
                }
            },
            {
                $group: {
                    _id: "$customer_id"
                }
            },
            { $count: "count" }
        ]);

        const uniqueCustomerCount = totalUniqueCustomers[0]?.count || 0;
        const repeatCustomerCount = repeatCustomers[0]?.count || 0;
        const repeatRate = uniqueCustomerCount > 0 ?
            Math.round((repeatCustomerCount / uniqueCustomerCount) * 100 * 100) / 100 : 0;

        res.status(200).json({
            success: true,
            period,
            summary: {
                totalCustomers: uniqueCustomerCount,
                newCustomers: newCustomers[0]?.count || 0,
                repeatCustomers: repeatCustomerCount,
                repeatRate: repeatRate
            },
            topCustomers
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================
// TIME-BASED ANALYTICS
// ============================================

const getPeakHours = async (req, res) => {
    try {
        const restaurantId = req.user._id;
        const { period = 'week', start_date, end_date } = req.query;

        const { startDate, endDate } = getDateRange(period, start_date, end_date);

        const result = await Order.aggregate([
            {
                $match: {
                    user_id: restaurantId,
                    order_date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $hour: "$order_date" },
                    orderCount: { $sum: 1 },
                    totalRevenue: { $sum: "$total_amount" },
                    avgOrderValue: { $avg: "$total_amount" }
                }
            },
            {
                $project: {
                    hour: "$_id",
                    orderCount: 1,
                    totalRevenue: { $round: ["$totalRevenue", 2] },
                    avgOrderValue: { $round: ["$avgOrderValue", 2] },
                    _id: 0
                }
            },
            { $sort: { hour: 1 } }
        ]);

        res.status(200).json({
            success: true,
            period,
            data: result
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const getDayOfWeekStats = async (req, res) => {
    try {
        const restaurantId = req.user._id;
        const { period = 'month', start_date, end_date } = req.query;

        const { startDate, endDate } = getDateRange(period, start_date, end_date);

        const result = await Order.aggregate([
            {
                $match: {
                    user_id: restaurantId,
                    order_date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $dayOfWeek: "$order_date" },
                    orderCount: { $sum: 1 },
                    totalRevenue: { $sum: "$total_amount" },
                    avgOrderValue: { $avg: "$total_amount" }
                }
            },
            {
                $project: {
                    dayOfWeek: "$_id",
                    dayName: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$_id", 1] }, then: "Sunday" },
                                { case: { $eq: ["$_id", 2] }, then: "Monday" },
                                { case: { $eq: ["$_id", 3] }, then: "Tuesday" },
                                { case: { $eq: ["$_id", 4] }, then: "Wednesday" },
                                { case: { $eq: ["$_id", 5] }, then: "Thursday" },
                                { case: { $eq: ["$_id", 6] }, then: "Friday" },
                                { case: { $eq: ["$_id", 7] }, then: "Saturday" }
                            ],
                            default: "Unknown"
                        }
                    },
                    orderCount: 1,
                    totalRevenue: { $round: ["$totalRevenue", 2] },
                    avgOrderValue: { $round: ["$avgOrderValue", 2] },
                    _id: 0
                }
            },
            { $sort: { dayOfWeek: 1 } }
        ]);

        res.status(200).json({
            success: true,
            period,
            data: result
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================
// COMPARISON ANALYTICS
// ============================================

const getComparison = async (req, res) => {
    try {
        const restaurantId = req.user._id;
        const { metric = 'revenue', compare = 'previous_period' } = req.query;

        // Current period
        const currentEnd = new Date();
        currentEnd.setHours(23, 59, 59, 999);
        const currentStart = new Date();
        currentStart.setDate(currentEnd.getDate() - 6);
        currentStart.setHours(0, 0, 0, 0);

        // Previous period
        const previousEnd = new Date(currentStart);
        previousEnd.setDate(previousEnd.getDate() - 1);
        previousEnd.setHours(23, 59, 59, 999);
        const previousStart = new Date(previousEnd);
        previousStart.setDate(previousEnd.getDate() - 6);
        previousStart.setHours(0, 0, 0, 0);

        const getCurrentData = async (start, end) => {
            const pipeline = [
                {
                    $match: {
                        user_id: restaurantId,
                        order_date: { $gte: start, $lte: end }
                    }
                }
            ];

            if (metric === 'revenue') {
                pipeline.push({
                    $group: {
                        _id: null,
                        value: { $sum: "$total_amount" },
                        count: { $sum: 1 }
                    }
                });
            } else if (metric === 'orders') {
                pipeline.push({
                    $group: {
                        _id: null,
                        value: { $sum: 1 }
                    }
                });
            } else if (metric === 'customers') {
                pipeline.push(
                    {
                        $match: {
                            customer_id: { $exists: true, $ne: null, $ne: "" }
                        }
                    },
                    {
                        $group: {
                            _id: "$customer_id"
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            value: { $sum: 1 }
                        }
                    }
                );
            }

            const result = await Order.aggregate(pipeline);
            return result[0] || { value: 0, count: 0 };
        };

        const currentData = await getCurrentData(currentStart, currentEnd);
        const previousData = await getCurrentData(previousStart, previousEnd);

        const change = previousData.value > 0 ?
            ((currentData.value - previousData.value) / previousData.value) * 100 : 0;

        res.status(200).json({
            success: true,
            metric,
            current: {
                value: Math.round(currentData.value * 100) / 100,
                period: { start: currentStart, end: currentEnd }
            },
            previous: {
                value: Math.round(previousData.value * 100) / 100,
                period: { start: previousStart, end: previousEnd }
            },
            change: Math.round(change * 100) / 100,
            trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================
// COMPREHENSIVE DASHBOARD
// ============================================

const getOverview = async (req, res) => {
    try {
        const restaurantId = req.user._id;
        const { period = 'today' } = req.query;

        const { startDate, endDate } = getDateRange(period);

        // Revenue summary
        const revenueSummary = await Order.aggregate([
            {
                $match: {
                    user_id: restaurantId,
                    order_date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$total_amount" },
                    totalOrders: { $sum: 1 },
                    avgOrderValue: { $avg: "$total_amount" },
                    totalDiscount: { $sum: "$discount_amount" },
                    totalWaveOff: { $sum: "$waveoff_amount" }
                }
            }
        ]);

        // Order type breakdown
        const orderTypes = await Order.aggregate([
            {
                $match: {
                    user_id: restaurantId,
                    order_date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: "$order_type",
                    count: { $sum: 1 },
                    revenue: { $sum: "$total_amount" }
                }
            }
        ]);

        // Top 5 dishes
        const topDishes = await Order.aggregate([
            {
                $match: {
                    user_id: restaurantId,
                    order_date: { $gte: startDate, $lte: endDate }
                }
            },
            { $unwind: "$order_items" },
            {
                $group: {
                    _id: "$order_items.dish_name",
                    quantity: { $sum: "$order_items.quantity" },
                    revenue: { $sum: { $multiply: ["$order_items.quantity", "$order_items.dish_price"] } }
                }
            },
            { $sort: { quantity: -1 } },
            { $limit: 5 }
        ]);

        // Payment methods
        const paymentMethods = await Order.aggregate([
            {
                $match: {
                    user_id: restaurantId,
                    order_date: { $gte: startDate, $lte: endDate },
                    payment_type: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: "$payment_type",
                    count: { $sum: 1 },
                    amount: { $sum: "$paid_amount" }
                }
            }
        ]);

        const summary = revenueSummary[0] || {
            totalRevenue: 0,
            totalOrders: 0,
            avgOrderValue: 0,
            totalDiscount: 0,
            totalWaveOff: 0
        };

        res.status(200).json({
            success: true,
            period,
            dateRange: { start: startDate, end: endDate },
            summary: {
                totalRevenue: Math.round(summary.totalRevenue * 100) / 100,
                totalOrders: summary.totalOrders,
                avgOrderValue: Math.round(summary.avgOrderValue * 100) / 100,
                totalDiscount: Math.round(summary.totalDiscount * 100) / 100,
                totalWaveOff: Math.round(summary.totalWaveOff * 100) / 100
            },
            orderTypes,
            topDishes,
            paymentMethods
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================
// PERFORMANCE ANALYTICS
// ============================================

const getWaiterPerformance = async (req, res) => {
    try {
        const restaurantId = req.user._id;
        const { period = 'week', start_date, end_date } = req.query;

        const { startDate, endDate } = getDateRange(period, start_date, end_date);

        const result = await Order.aggregate([
            {
                $match: {
                    user_id: restaurantId,
                    order_date: { $gte: startDate, $lte: endDate },
                    waiter: { $exists: true, $ne: null, $ne: "" }
                }
            },
            {
                $group: {
                    _id: "$waiter",
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: "$total_amount" },
                    avgOrderValue: { $avg: "$total_amount" },
                    totalTables: { $addToSet: "$table_no" }
                }
            },
            {
                $project: {
                    waiter: "$_id",
                    totalOrders: 1,
                    totalRevenue: { $round: ["$totalRevenue", 2] },
                    avgOrderValue: { $round: ["$avgOrderValue", 2] },
                    tablesServed: { $size: "$totalTables" },
                    _id: 0
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        res.status(200).json({
            success: true,
            period,
            data: result
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const getTablePerformance = async (req, res) => {
    try {
        const restaurantId = req.user._id;
        const { period = 'week', start_date, end_date } = req.query;

        const { startDate, endDate } = getDateRange(period, start_date, end_date);

        const result = await Order.aggregate([
            {
                $match: {
                    user_id: restaurantId,
                    order_date: { $gte: startDate, $lte: endDate },
                    table_no: { $exists: true, $ne: null, $ne: "" }
                }
            },
            {
                $group: {
                    _id: {
                        tableNo: "$table_no",
                        tableArea: "$table_area"
                    },
                    orderCount: { $sum: 1 },
                    totalRevenue: { $sum: "$total_amount" },
                    avgOrderValue: { $avg: "$total_amount" },
                    totalPersons: { $sum: { $toInt: { $ifNull: ["$total_persons", "0"] } } }
                }
            },
            {
                $project: {
                    tableNo: "$_id.tableNo",
                    tableArea: "$_id.tableArea",
                    orderCount: 1,
                    totalRevenue: { $round: ["$totalRevenue", 2] },
                    avgOrderValue: { $round: ["$avgOrderValue", 2] },
                    totalPersons: 1,
                    _id: 0
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        res.status(200).json({
            success: true,
            period,
            data: result
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================
// INVENTORY INSIGHTS
// ============================================

const getLowPerformingDishes = async (req, res) => {
    try {
        const restaurantId = req.user._id;
        const { period = 'month', start_date, end_date, threshold = 5 } = req.query;

        const { startDate, endDate } = getDateRange(period, start_date, end_date);

        // Get all dishes from menu
        const allDishes = await Menu.aggregate([
            { $match: { user_id: restaurantId } },
            { $unwind: "$dishes" },
            {
                $match: {
                    "dishes.is_available": true
                }
            },
            {
                $project: {
                    dishName: "$dishes.dish_name",
                    category: "$category",
                    price: "$dishes.dish_price",
                    isSpecial: "$dishes.is_special"
                }
            }
        ]);

        // Get ordered dishes
        const orderedDishes = await Order.aggregate([
            {
                $match: {
                    user_id: restaurantId,
                    order_date: { $gte: startDate, $lte: endDate }
                }
            },
            { $unwind: "$order_items" },
            {
                $group: {
                    _id: { $toLower: { $trim: { input: "$order_items.dish_name" } } },
                    orderCount: { $sum: "$order_items.quantity" }
                }
            }
        ]);

        // Create a map of ordered dishes
        const orderedMap = {};
        orderedDishes.forEach(dish => {
            orderedMap[dish._id] = dish.orderCount;
        });

        // Find low performing dishes
        const lowPerforming = allDishes
            .map(dish => {
                const normalizedName = dish.dishName.toLowerCase().trim();
                const orderCount = orderedMap[normalizedName] || 0;
                return {
                    dishName: dish.dishName,
                    category: dish.category,
                    price: dish.price,
                    isSpecial: dish.isSpecial,
                    orderCount
                };
            })
            .filter(dish => dish.orderCount < parseInt(threshold))
            .sort((a, b) => a.orderCount - b.orderCount);

        res.status(200).json({
            success: true,
            period,
            threshold: parseInt(threshold),
            totalDishes: allDishes.length,
            lowPerformingCount: lowPerforming.length,
            data: lowPerforming
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

module.exports = {
    // Revenue
    getRevenueStats,

    // Orders
    getOrderStats,

    // Dishes & Menu
    getTopDishes,
    getCategoryStats,
    getLowPerformingDishes,

    // Customers
    getCustomerStats,

    // Time-based
    getPeakHours,
    getDayOfWeekStats,

    // Comparison
    getComparison,

    // Dashboard
    getOverview,

    // Performance
    getWaiterPerformance,
    getTablePerformance
};