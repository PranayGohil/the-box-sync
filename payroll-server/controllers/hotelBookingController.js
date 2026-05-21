const User = require("../models/userModel");
const HotelBooking = require("../models/hotelBookingModel");
const Room = require("../models/roomModel");
const RoomCategory = require("../models/roomCategoryModel");
const Customer = require("../models/customerModel");

// Create a new booking
exports.createBooking = async (req, res) => {
    try {
        const {
            customer_id,
            category_id,
            subcategory_name,
            room_id,
            check_in,
            check_out,
            num_guests,
            total_price,
            special_request,
            source,
        } = req.body;
        const user_id = req.user;

        // Validate dates
        const checkInDate = new Date(check_in);
        const checkOutDate = new Date(check_out);

        if (checkInDate >= checkOutDate) {
            return res.status(400).json({
                success: false,
                message: 'Check-out date must be after check-in date',
            });
        }

        // Check if room exists and belongs to user
        const room = await Room.findOne({ _id: room_id, user_id });
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found',
            });
        }

        // Check for conflicting bookings
        const conflictingBooking = await HotelBooking.findOne({
            room_id,
            status: { $nin: ['Cancelled', 'Checked Out'] },
            $or: [
                {
                    check_in: { $lt: checkOutDate },
                    check_out: { $gt: checkInDate },
                },
            ],
        });

        if (conflictingBooking) {
            return res.status(400).json({
                success: false,
                message: 'Room is already booked for the selected dates',
            });
        }

        const newBooking = new HotelBooking({
            user_id,
            customer_id,
            category_id,
            subcategory_name,
            room_id,
            check_in: checkInDate,
            check_out: checkOutDate,
            num_guests,
            total_price,
            special_request,
            source: source || 'Direct',
        });

        await newBooking.save();

        const populatedBooking = await HotelBooking.findById(newBooking._id)
            .populate('customer_id')
            .populate('room_id')
            .populate('category_id');

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: populatedBooking,
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating booking',
            error: error.message,
        });
    }
};

// Get all bookings for a manager
exports.getAllBookings = async (req, res) => {
    try {
        const user_id = req.user;
        const { status, start_date, end_date } = req.query;

        const query = { user_id };

        if (status) {
            query.status = status;
        }

        if (start_date && end_date) {
            query.check_in = {
                $gte: new Date(start_date),
                $lte: new Date(end_date),
            };
        }

        const bookings = await HotelBooking.find(query)
            .populate('customer_id')
            .populate('room_id')
            .populate('category_id')
            .sort({ created_at: -1 });

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings,
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings',
            error: error.message,
        });
    }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user;

        const booking = await HotelBooking.findOne({ _id: id, user_id })
            .populate('customer_id')
            .populate('room_id')
            .populate('category_id');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        res.status(200).json({
            success: true,
            data: booking,
        });
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching booking',
            error: error.message,
        });
    }
};

// Update booking
exports.updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user;
        const { check_in, check_out, num_guests, total_price, special_request, status } = req.body;

        const booking = await HotelBooking.findOne({ _id: id, user_id });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        // If dates are being changed, check for conflicts
        if (check_in || check_out) {
            const checkInDate = new Date(check_in || booking.check_in);
            const checkOutDate = new Date(check_out || booking.check_out);

            const conflictingBooking = await HotelBooking.findOne({
                room_id: booking.room_id,
                _id: { $ne: id },
                status: { $nin: ['Cancelled', 'Checked Out'] },
                $or: [
                    {
                        check_in: { $lt: checkOutDate },
                        check_out: { $gt: checkInDate },
                    },
                ],
            });

            if (conflictingBooking) {
                return res.status(400).json({
                    success: false,
                    message: 'Room is already booked for the selected dates',
                });
            }
        }

        const updateData = {
            ...(check_in && { check_in: new Date(check_in) }),
            ...(check_out && { check_out: new Date(check_out) }),
            ...(num_guests !== undefined && { num_guests }),
            ...(total_price !== undefined && { total_price }),
            ...(special_request !== undefined && { special_request }),
            ...(status && { status }),
            updated_at: new Date(),
        };

        const updatedBooking = await HotelBooking.findByIdAndUpdate(id, updateData, {
            new: true,
        })
            .populate('customer_id')
            .populate('room_id')
            .populate('category_id');

        res.status(200).json({
            success: true,
            message: 'Booking updated successfully',
            data: updatedBooking,
        });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating booking',
            error: error.message,
        });
    }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user;

        const booking = await HotelBooking.findOne({ _id: id, user_id });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        booking.status = 'Cancelled';
        booking.updated_at = new Date();
        await booking.save();

        const updatedBooking = await HotelBooking.findById(id)
            .populate('customer_id')
            .populate('room_id')
            .populate('category_id');

        res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully',
            data: updatedBooking,
        });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling booking',
            error: error.message,
        });
    }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const user_id = req.user;

        const validStatuses = ['Booked', 'Checked In', 'Checked Out', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid booking status',
            });
        }

        const booking = await HotelBooking.findOne({ _id: id, user_id });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        booking.status = status;
        booking.updated_at = new Date();
        await booking.save();

        const updatedBooking = await HotelBooking.findById(id)
            .populate('customer_id')
            .populate('room_id')
            .populate('category_id');

        res.status(200).json({
            success: true,
            message: `Booking status updated to ${status}`,
            data: updatedBooking,
        });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating booking status',
            error: error.message,
        });
    }
};

// Get booking statistics
exports.getBookingStats = async (req, res) => {
    try {
        const user_id = req.user;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalBookings = await HotelBooking.countDocuments({ user_id });
        const bookedCount = await HotelBooking.countDocuments({ user_id, status: 'Booked' });
        const checkedInCount = await HotelBooking.countDocuments({ user_id, status: 'Checked In' });
        const checkedOutCount = await HotelBooking.countDocuments({ user_id, status: 'Checked Out' });
        const cancelledCount = await HotelBooking.countDocuments({ user_id, status: 'Cancelled' });

        // Today's bookings
        const todayBookings = await HotelBooking.countDocuments({
            user_id,
            check_in: { $gte: today },
            status: { $ne: 'Cancelled' },
        });

        // Revenue calculation
        const revenue = await HotelBooking.aggregate([
            { $match: { user_id, status: 'Checked Out' } },
            { $group: { _id: null, total: { $sum: '$total_price' } } },
        ]);

        const totalRevenue = revenue.length > 0 ? revenue[0].total : 0;

        // Upcoming checkouts
        const upcomingCheckouts = await HotelBooking.find({
            user_id,
            check_out: { $gte: today },
            status: 'Checked In',
        })
            .populate('customer_id')
            .populate('room_id')
            .limit(5);

        res.status(200).json({
            success: true,
            data: {
                totalBookings,
                bookedCount,
                checkedInCount,
                checkedOutCount,
                cancelledCount,
                todayBookings,
                totalRevenue,
                upcomingCheckouts,
            },
        });
    } catch (error) {
        console.error('Error fetching booking stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching booking statistics',
            error: error.message,
        });
    }
};

// Get available rooms for booking
exports.getAvailableRooms = async (req, res) => {
    try {
        const { check_in, check_out, category_id } = req.query;
        const user_id = req.user;
        console.log("User ID : ", req.user);
        console.log(check_in, check_out, category_id);
        const checkInDate = new Date(check_in);
        const checkOutDate = new Date(check_out);

        console.log(checkInDate, checkOutDate);
        if (checkInDate >= checkOutDate) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date range',
            });
        }

        const query = { user_id };
        if (category_id) {
            query.category = category_id;
        }

        const bookedRooms = await HotelBooking.find({
            status: { $nin: ['Cancelled', 'Checked Out'] },
            $or: [
                {
                    check_in: { $lt: checkOutDate },
                    check_out: { $gt: checkInDate },
                },
            ],
        }).distinct('room_id');
        console.log("Booked Rooms : ", bookedRooms);
        query._id = { $nin: bookedRooms };
        console.log("Query : ", query);
        const availableRooms = await Room.find(query)
            .populate('category')
            .select('room_name room_no room_price max_person room_imgs category');

        console.log("Available Rooms : ", availableRooms);

        res.status(200).json({
            success: true,
            count: availableRooms.length,
            data: availableRooms,
        });
    } catch (error) {
        console.error('Error fetching available rooms:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching available rooms',
            error: error.message,
        });
    }
};

// Delete booking
exports.deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user;

        const booking = await HotelBooking.findOne({ _id: id, user_id });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        await HotelBooking.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Booking deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting booking',
            error: error.message,
        });
    }
};