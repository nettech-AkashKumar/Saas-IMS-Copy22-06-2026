const cron = require('node-cron');
const { dailyInterestRecalculation } = require('../controllers/CustomerInvoiceController');

// Schedule job to run daily at midnight (00:00)
// Format: "0 0 * * *" for midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily interest recalculation job...');
  const result = await dailyInterestRecalculation();
  console.log('Daily interest recalculation completed:', result);
}, {
  timezone: "Asia/Kolkata" // Adjust to your timezone
});

module.exports = { startInterestRecalculationJob: () => console.log('') };