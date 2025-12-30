const Waiter = require('../models/waiterModel');

const addWaiter = async (req, res) => {
    try {
        const user_id = req.user;
        const { full_name } = req.body;
        console.log(user_id, full_name);
        const newWaiter = new Waiter({ user_id, full_name });
        await newWaiter.save();
        res.status(201).json({ message: 'Waiter added successfully' });
    } catch (error) {
        console.error('Error adding waiter:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getWaiters = async (req, res) => {
    try {
        const userId = req.user._id;
        const waiters = await Waiter.find({ user_id: userId }).lean();
        res.json({ success: true, data: waiters });
    } catch (error) {
        console.error('Error fetching waiters:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const editWaiter = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name } = req.body;
        const waiter = await Waiter.findById(id);
        if (!waiter) {
            return res.status(404).json({ error: 'Waiter not found' });
        }
        waiter.full_name = full_name;
        await waiter.save();
        res.status(200).json({ message: 'Waiter updated successfully' });
    } catch (error) {
        console.error('Error updating waiter:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteWaiter = async (req, res) => {
    try {
        const { id } = req.params;
        const waiter = await Waiter.findByIdAndDelete(id);

        res.status(200).json({ message: 'Waiter deleted successfully' });
    } catch (error) {
        console.error('Error deleting waiter:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    addWaiter,
    getWaiters,
    editWaiter,
    deleteWaiter
}