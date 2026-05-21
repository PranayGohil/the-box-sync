const fs = require('fs');
const path = require('path');
const RoomCategory = require("../models/roomCategoryModel");
const Room = require('../models/roomModel');

// Add Room Category
exports.addRoomCategory = async (req, res) => {
  try {
    const { category, amenities, subcategory, thumbnail_index } = req.body;
    const user_id = req.user;

    const files = req.files || [];
    const thumbIndex = parseInt(thumbnail_index) || 0;

    // Create room_imgs array with thumbnail flag
    const room_imgs = files.map((file, index) => ({
      image: "/room/categories/" + file.filename,
      is_thumbnail: index === thumbIndex,
    }));

    const categoryData = {
      user_id,
      category,
      room_imgs,
      amenities: JSON.parse(amenities),
      subcategory: JSON.parse(subcategory),
    };

    const newCategory = new RoomCategory(categoryData);
    await newCategory.save();

    res.status(201).json({
      success: true,
      message: 'Room category added successfully',
      data: newCategory,
    });
  } catch (error) {
    console.error('Error adding room category:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding room category',
      error: error.message,
    });
  }
};

// Get All Room Categories with Rooms
exports.getRoomCategories = async (req, res) => {
  try {
    const user_id = req.user;
    const categories = await RoomCategory.find({ user_id });
    // Populate rooms for each category
    const categoriesWithRooms = await Promise.all(
      categories.map(async (category) => {
        const rooms = await Room.find({
          category: category._id,
          user_id
        });

        return {
          ...category.toObject(),
          rooms,
        };
      })
    );
    res.status(200).json({
      success: true,
      data: categoriesWithRooms,
    });
  } catch (error) {
    console.error('Error fetching room categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching room categories',
      error: error.message,
    });
  }
};

// Get Single Room Category
exports.getRoomCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user;

    const category = await RoomCategory.findOne({ _id: id, user_id });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Room category not found',
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error fetching room category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching room category',
      error: error.message,
    });
  }
};

// Update Room Category
exports.updateRoomCategory = async (req, res) => {
  try {
    const { category, amenities, subcategory, existing_images, thumbnail_index } = req.body;
    const { id } = req.params;
    const user_id = req.user;

    const existingCategory = await RoomCategory.findOne({ _id: id, user_id });

    if (!existingCategory) {
      console.error('Room category not found');
      return res.status(404).json({
        success: false,
        message: 'Room category not found',
      });
    }

    const files = req.files || [];
    const parsedExistingImages = JSON.parse(existing_images || '[]');
    const thumbIndex = parseInt(thumbnail_index) || 0;

    // Delete removed images from file system
    const existingImageNames = parsedExistingImages.map(img => img.image);
    if (existingCategory.room_imgs && existingCategory.room_imgs.length > 0) {
      existingCategory.room_imgs.forEach((img) => {
        if (!existingImageNames.includes(img.image)) {
          const imagePath = path.join(__dirname, '../uploads', img.image);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
      });
    }

    // Prepare new images array
    const newUploadedImages = files.map((file) => ({
      image: "/room/categories/" + file.filename,
      is_thumbnail: false,
    }));

    // Combine existing and new images
    const allImages = [...parsedExistingImages, ...newUploadedImages];

    // Set thumbnail based on index
    const room_imgs = allImages.map((img, index) => ({
      ...img,
      is_thumbnail: index === thumbIndex,
    }));

    const updateData = {
      category,
      room_imgs,
      amenities: JSON.parse(amenities),
      subcategory: JSON.parse(subcategory),
    };

    const updatedCategory = await RoomCategory.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Room category updated successfully',
      data: updatedCategory,
    });
  } catch (error) {
    console.error('Error updating room category:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating room category',
      error: error.message,
    });
  }
};

// Delete Room Category
exports.deleteRoomCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user;

    const category = await RoomCategory.findOne({ _id: id, user_id });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Room category not found',
      });
    }

    // Delete associated rooms
    const rooms = await Room.find({ category: id, user_id });

    // Delete room images
    rooms.forEach((room) => {
      if (room.room_imgs) {
        const roomImagePath = path.join(__dirname, '../uploads', room.room_imgs);
        if (fs.existsSync(roomImagePath)) {
          fs.unlinkSync(roomImagePath);
        }
      }
    });

    // Delete all rooms in this category
    await Room.deleteMany({ category: id, user_id });

    // Delete category image
    if (category.category_img) {
      const categoryImagePath = path.join(__dirname, '../uploads', category.category_img);
      if (fs.existsSync(categoryImagePath)) {
        fs.unlinkSync(categoryImagePath);
      }
    }

    await RoomCategory.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Room category and associated rooms deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting room category:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting room category',
      error: error.message,
    });
  }
};

// **************************************************************
// Add Room(s) - Multiple rooms can be added at once
exports.addRoom = async (req, res) => {
  try {
    const { category, rooms, room_indices } = req.body;
    const user_id = req.user;

    // Check if category exists
    const categoryExists = await RoomCategory.findOne({ _id: category, user_id });
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'Room category not found',
      });
    }

    const roomsData = JSON.parse(rooms);
    const files = req.files || [];
    const indices = room_indices ? (Array.isArray(room_indices) ? room_indices : [room_indices]) : [];

    // Group images by room index
    const imagesByRoom = {};
    files.forEach((file, fileIndex) => {
      const roomIndex = parseInt(indices[fileIndex]) || 0;
      if (!imagesByRoom[roomIndex]) {
        imagesByRoom[roomIndex] = [];
      }
      imagesByRoom[roomIndex].push(file.filename);
    });

    // Create rooms with their images
    const roomsToInsert = roomsData.map((room, index) => {
      const roomImageFiles = imagesByRoom[index] || [];
      const thumbnailIdx = parseInt(room.thumbnail_index) || 0;

      const room_imgs = roomImageFiles.map((filename, imgIndex) => ({
        image: "/room/categories/" + filename,
        is_thumbnail: imgIndex === thumbnailIdx,
      }));

      return {
        user_id,
        category,
        room_name: room.room_name,
        room_no: room.room_no,
        room_details: room.room_details,
        max_person: room.max_person,
        room_price: room.room_price,
        room_status: room.room_status || 'Available',
        room_imgs,
      };
    });

    const insertedRooms = await Room.insertMany(roomsToInsert);

    res.status(201).json({
      success: true,
      message: `${insertedRooms.length} room(s) added successfully`,
      data: insertedRooms,
    });
  } catch (error) {
    console.error('Error adding rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding rooms',
      error: error.message,
    });
  }
};

// Get All Rooms with optional filters
exports.getRooms = async (req, res) => {
  try {
    const user_id = req.user;
    const { category, status, search } = req.query;

    const query = { user_id };

    // Apply filters
    if (category) {
      query.category = category;
    }

    if (status) {
      query.room_status = status;
    }

    // Search by room name or room number
    if (search) {
      query.$or = [
        { room_name: { $regex: search, $options: 'i' } },
        { room_no: { $regex: search, $options: 'i' } },
      ];
    }

    const rooms = await Room.find(query)
      .populate('category', 'category category_imgs')
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching rooms',
      error: error.message,
    });
  }
};

// Get Single Room by ID
exports.getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user;

    const room = await Room.findOne({ _id: id, user_id })
      .populate('category', 'category category_imgs amenities subcategory');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching room',
      error: error.message,
    });
  }
};

// Update Room
exports.updateRoom = async (req, res) => {
  try {
    const {
      room_name,
      room_no,
      category,
      room_details,
      max_person,
      room_price,
      room_status,
      existing_images,
      thumbnail_index,
    } = req.body;

    const { id } = req.params;
    const user_id = req.user;

    // Check if room exists
    const existingRoom = await Room.findOne({ _id: id, user_id });

    if (!existingRoom) {
      console.log('Room not found');
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // Check if new room number already exists (excluding current room)
    if (room_no !== existingRoom.room_no) {
      const roomNoExists = await Room.findOne({
        room_no,
        user_id,
        _id: { $ne: id },
      });

      if (roomNoExists) {
        console.log('Room number already exists');
        return res.status(400).json({
          success: false,
          message: 'Room number already exists',
        });
      }
    }

    // Check if category exists
    if (category) {
      const categoryExists = await RoomCategory.findOne({ _id: category, user_id });
      if (!categoryExists) {
        console.log('Room category not found');
        return res.status(404).json({
          success: false,
          message: 'Room category not found',
        });
      }
    }

    const files = req.files || [];
    const parsedExistingImages = JSON.parse(existing_images || '[]');
    const thumbIndex = parseInt(thumbnail_index) || 0;

    // Delete removed images from file system
    const existingImageNames = parsedExistingImages.map(img => img.image);
    if (existingRoom.room_imgs && existingRoom.room_imgs.length > 0) {
      existingRoom.room_imgs.forEach((img) => {
        if (!existingImageNames.includes(img.image)) {
          const imagePath = path.join(__dirname, '../uploads/room/categories', img.image);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
      });
    }

    // Prepare new images array
    const newUploadedImages = files.map((file) => ({
      image: "/room/categories/" + file.filename,
      is_thumbnail: false,
    }));

    // Combine existing and new images
    const allImages = [...parsedExistingImages, ...newUploadedImages];

    // Set thumbnail based on index
    const room_imgs = allImages.map((img, index) => ({
      ...img,
      is_thumbnail: index === thumbIndex,
    }));

    const updateData = {
      room_name,
      room_no,
      category,
      room_details,
      max_person,
      room_price,
      room_status,
      room_imgs,
    };

    const updatedRoom = await Room.findByIdAndUpdate({ _id: id }, updateData, {
      new: true,
      runValidators: true,
    }).populate('category', 'category category_imgs');

    res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: updatedRoom,
    });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating room',
      error: error.message,
    });
  }
};

// Delete Room
exports.deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user;

    const room = await Room.findOne({ _id: id, user_id });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // Delete all room images
    if (room.room_imgs && room.room_imgs.length > 0) {
      room.room_imgs.forEach((img) => {
        const imagePath = path.join(__dirname, '../uploads', img.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }

    await Room.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Room deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting room',
      error: error.message,
    });
  }
};

// Update Room Status (Quick status change)
exports.updateRoomStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { room_status } = req.body;
    const user_id = req.user;

    // Validate status
    const validStatuses = ['Available', 'Occupied', 'Maintenance'];
    if (!validStatuses.includes(room_status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room status. Must be Available, Occupied, or Maintenance',
      });
    }

    const room = await Room.findOne({ _id: id, user_id });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    room.room_status = room_status;
    await room.save();

    res.status(200).json({
      success: true,
      message: 'Room status updated successfully',
      data: room,
    });
  } catch (error) {
    console.error('Error updating room status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating room status',
      error: error.message,
    });
  }
};

// Get Available Rooms
exports.getAvailableRooms = async (req, res) => {
  try {
    const user_id = req.user;
    const { category } = req.query;

    const query = {
      user_id,
      room_status: 'Available',
    };

    if (category) {
      query.category = category;
    }

    const rooms = await Room.find(query)
      .populate('category', 'category category_imgs')
      .sort({ room_no: 1 });

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
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

// Get Rooms by Category
exports.getRoomsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const user_id = req.user;

    // Check if category exists
    const category = await RoomCategory.findOne({ _id: categoryId, user_id });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Room category not found',
      });
    }

    const rooms = await Room.find({ category: categoryId, user_id })
      .populate('category', 'category category_imgs')
      .sort({ room_no: 1 });

    res.status(200).json({
      success: true,
      category: category.category,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    console.error('Error fetching rooms by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching rooms by category',
      error: error.message,
    });
  }
};

// Get Room Statistics
exports.getRoomStats = async (req, res) => {
  try {
    const user_id = req.user;

    const totalRooms = await Room.countDocuments({ user_id });
    const availableRooms = await Room.countDocuments({ user_id, room_status: 'Available' });
    const occupiedRooms = await Room.countDocuments({ user_id, room_status: 'Occupied' });
    const maintenanceRooms = await Room.countDocuments({ user_id, room_status: 'Maintenance' });

    // Get room count by category
    const roomsByCategory = await Room.aggregate([
      { $match: { user_id } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          available: {
            $sum: { $cond: [{ $eq: ['$room_status', 'Available'] }, 1, 0] },
          },
          occupied: {
            $sum: { $cond: [{ $eq: ['$room_status', 'Occupied'] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'room_categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      { $unwind: '$categoryInfo' },
      {
        $project: {
          category: '$categoryInfo.category',
          count: 1,
          available: 1,
          occupied: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalRooms,
        available: availableRooms,
        occupied: occupiedRooms,
        maintenance: maintenanceRooms,
        occupancyRate: totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(2) : 0,
        byCategory: roomsByCategory,
      },
    });
  } catch (error) {
    console.error('Error fetching room statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching room statistics',
      error: error.message,
    });
  }
};

// Bulk Update Room Status
exports.bulkUpdateRoomStatus = async (req, res) => {
  try {
    const { roomIds, room_status } = req.body;
    const user_id = req.user;

    if (!Array.isArray(roomIds) || roomIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Room IDs array is required',
      });
    }

    const validStatuses = ['Available', 'Occupied', 'Maintenance'];
    if (!validStatuses.includes(room_status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room status',
      });
    }

    const result = await Room.updateMany(
      { _id: { $in: roomIds }, user_id },
      { $set: { room_status } }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} room(s) updated successfully`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error('Error bulk updating room status:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk updating room status',
      error: error.message,
    });
  }
};