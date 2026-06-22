const nodemailer = require("nodemailer");

// ✅ Create transporter once
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER, // your Gmail
    pass: process.env.MAIL_PASS, // app password if using Gmail
  },
});

const wrapHtmlEmail = (content) => {
  const supportEmail = process.env.MAIL_USER || "support@example.com";
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Notification</title>
  </head>
  <body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f4f6fb;color:#202124;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#f4f6fb;padding:30px 0;">
      <tr>
        <td align="center">
          <table width="600" border="0" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 24px 64px rgba(15,23,42,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#2558ff,#36b8ff);padding:32px 30px;text-align:center;color:#ffffff;">
                <h1 style="margin:0;font-size:28px;letter-spacing:-0.02em;">MyMunc SaaS</h1>
                <p style="margin:8px 0 0;font-size:15px;opacity:0.88;">Smart business tools for your growing company</p>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 30px 20px;font-size:16px;line-height:1.7;color:#3e4c59;">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="background:#f7faff;padding:24px 30px;text-align:center;color:#6b7280;font-size:13px;">
                <p style="margin:0;">Need help? Contact us at
                  <a href="mailto:${supportEmail}" style="color:#2558ff;text-decoration:none;">${supportEmail}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

/**
 * Send email
 * @param {Object} options
 * @param {string} options.to - recipient email
 * @param {string} options.subject - email subject
 * @param {string} options.html - HTML content
 */
const sendMail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"MyMunc SaaS" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html: wrapHtmlEmail(html),
    });
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}`, err);
    throw err;
  }
};

module.exports = { sendMail };
