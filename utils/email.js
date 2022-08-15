const nodemailer = require('nodemailer');

const sendEmail = async options => {
  // Creating a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // Defining the email options
  const mailOptions = {
    from: 'Rishav Kumar <rishavkumar2573@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
    // html:
  };

  // Actually sending the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
