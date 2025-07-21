
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587, // <-- TLS port
  secure: false,
  auth: {
    user: process.env.EMAIL, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Use App Password from Gmail
  },
});

/**
 * Sends an alert email when the website is down
 * @param {string} siteUrl - The URL that failed
 */
const sendAlertEmail = async (siteUrl,to,subject,text) => {
  const mailOptions = {
    from: process.env.EMAIL, // Your Gmail address
    to, // You can make this dynamic
    subject,
    text
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Alert email sent: ", info.response);
  } catch (error) {
    console.error("❌ Error sending alert email:", error);
  }
};

module.exports = { sendAlertEmail };