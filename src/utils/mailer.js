const { SendMailClient } = require("zeptomail");
const env = require("../config/env");
const log = require('../core/logger');

const client = new SendMailClient({
  url: env.zepto.url,
  token: env.zepto.token
});

/**
 * Send transactional email via ZeptoMail
 * @param {Object} options
 * @param {string} options.toAddress - Recipient email
 * @param {string} options.toName - Recipient name
 * @param {string} options.subject - Email subject
 * @param {string} options.htmlBody - HTML email body
 */
const sendEmail = async ({ toAddress, toName, subject, htmlBody }) => {
  try {
    await client.sendMail({
      from: {
        address: env.zepto.fromAddress,
        name: env.zepto.fromName
      },
      to: [
        {
          email_address: {
            address: toAddress,
            name: toName
          }
        }
      ],
      subject,
      htmlbody: htmlBody
    });
    log.info(`Email sent to ${toAddress} - Subject: ${subject}`);
  } catch (err) {
    log.error(`Failed to send email to ${toAddress} - ${err.message}`);
    throw new Error("Email delivery failed");
  }
};

module.exports = { sendEmail };
