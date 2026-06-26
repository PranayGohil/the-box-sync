const cron = require('node-cron');
const StaffAttendance = require('../models/staffAttendanceModel');
const fs = require('fs');
const path = require('path');

// Run every night at midnight (0 0 * * *)
cron.schedule('0 0 * * *', async () => {
    console.log('Running WFH Tracking Cleanup Cron Job...');
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Find records with wfh tracking that are older than 30 days
        const records = await StaffAttendance.find({
            createdAt: { $lt: thirtyDaysAgo },
            'wfh_tracking.is_wfh': true
        });

        let deletedFilesCount = 0;

        for (const record of records) {
            // Delete screenshots
            if (record.wfh_tracking && record.wfh_tracking.screenshots) {
                record.wfh_tracking.screenshots.forEach(shot => {
                    if (shot.url) {
                        const filePath = path.join(__dirname, '../', shot.url);
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                            deletedFilesCount++;
                        }
                    }
                });
                record.wfh_tracking.screenshots = [];
            }

            // Delete webcam snaps
            if (record.wfh_tracking && record.wfh_tracking.webcam_snapshots) {
                record.wfh_tracking.webcam_snapshots.forEach(shot => {
                    if (shot.url) {
                        const filePath = path.join(__dirname, '../', shot.url);
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                            deletedFilesCount++;
                        }
                    }
                });
                record.wfh_tracking.webcam_snapshots = [];
            }

            // Save the record to reflect deleted images
            await record.save();
        }

        console.log(`WFH Cleanup completed. Deleted ${deletedFilesCount} old image files from disk.`);
    } catch (err) {
        console.error('Error during WFH Cleanup Cron Job:', err);
    }
});
