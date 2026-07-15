import cron from 'node-cron';
import User from '../models/User.model';
import Notification from '../models/Notification.model';

function differenceInDays(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export function startReminderJob(): void {
  // Run every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('[Reminder Job] Running 90-day donation reminder check...');
    try {
      const today = new Date();
      const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
      // Find users who donated >= 90 days ago and haven't been reminded today
      const users = await User.find({
        lastDonationDate: { $lte: ninetyDaysAgo },
        $or: [
          { lastDonationReminderSent: null },
          { lastDonationReminderSent: { $lt: new Date(today.toDateString()) } }
        ]
      }).select('_id name lastDonationDate');

      let count = 0;
      for (const user of users) {
        const daysSince = user.lastDonationDate ? differenceInDays(today, user.lastDonationDate) : 999;
        if (daysSince >= 90) {
          await Notification.create({
            userId: user._id,
            type: 'donation_reminder',
            title: '💉 You Can Donate Again!',
            body: `It's been ${daysSince} days since your last donation. You are now eligible to donate blood and save a life!`,
            data: { daysSince },
            actionUrl: '/appointments',
          });
          await User.findByIdAndUpdate(user._id, { lastDonationReminderSent: today, eligible: true });
          count++;
        }
      }
      console.log(`[Reminder Job] Sent ${count} donation reminders.`);
    } catch (err) {
      console.error('[Reminder Job] Error:', err);
    }
  });
  console.log('[Reminder Job] 90-day donation reminder scheduler started (runs daily at 8:00 AM)');
}
