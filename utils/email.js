const nodemailer = require("nodemailer");

const sendEmail = options => {
    // 1) Create transport
    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // 2) Define the email options
    const mailOptions = {
        from: "TV-Series DB",
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: `<h1>Reset token</h1>\n<p>${options.message}</p>`
    };

    // 3) Send the email
    transport.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log("ERROR WHILE SENDIND EMAIL");
            console.log(err.name, err.message);
        }
    });
};

module.exports = sendEmail;