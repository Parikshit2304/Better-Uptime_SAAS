const twilio = require("twilio"); 

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createMessage() {
  const message = await client.messages.create({
    body: "Hi this is a test message from Uptime SAAS",
    from: "whatsapp:+12319305663",
    to: "whatsapp:+919999999999" // Replace with the recipient's WhatsApp number,
  });

  console.log(message.body);
}

module.exports={ createMessage };