import nodemailer from "nodemailer";

const user = process.env.GMAIL_USER?.trim();
const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
const recipient =
  process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ||
  process.env.QUOTE_RECIPIENT_EMAIL?.trim() ||
  process.env.QUOTE_EMAIL_TO?.trim() ||
  user;

console.log("=================================================");
console.log("       Citiply Gmail SMTP Diagnostic Test        ");
console.log("=================================================\n");

if (!user || !pass) {
  console.log("⚠️  Gmail SMTP is NOT fully configured yet in your .env file.");
  console.log("Current configuration status:");
  console.log(`  - GMAIL_USER: ${user ? "✅ Configured (" + user + ")" : "❌ Missing"}`);
  console.log(`  - GMAIL_APP_PASSWORD: ${pass ? "✅ Configured" : "❌ Missing"}`);
  console.log(`  - ADMIN_NOTIFICATION_EMAIL: ${recipient ? "✅ Configured (" + recipient + ")" : "❌ Missing"}`);
  console.log("\nTo enable Gmail SMTP notifications:");
  console.log("1. Open your Google Account -> Security -> 2-Step Verification -> App passwords.");
  console.log("2. Generate a new App Password (name it e.g. 'Citiply Catalogue').");
  console.log("3. Add the following to your .env file:");
  console.log("   GMAIL_USER=your-email@gmail.com");
  console.log("   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx");
  console.log("   ADMIN_NOTIFICATION_EMAIL=recipient-email@gmail.com");
  process.exit(1);
}

console.log(`Testing SMTP connection for account: ${user}...`);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user, pass }
});

async function runTest() {
  try {
    await transporter.verify();
    console.log("✅ SMTP Transporter authenticated successfully with Gmail!\n");

    const shouldSend = process.argv.includes("--send");
    if (!shouldSend) {
      console.log("ℹ️  SMTP connection is verified and ready.");
      console.log("   To send a live test email to " + recipient + ", run:");
      console.log("   npm run test:email -- --send\n");
      return;
    }

    console.log(`Sending sample enquiry notification to ${recipient}...`);
    const info = await transporter.sendMail({
      from: `Citiply Notifications <${user}>`,
      to: recipient,
      subject: "Test Enquiry Notification — Citiply Catalogue",
      html: `
        <div style="font-family:sans-serif;padding:20px;border:1px solid #e5e7eb;border-radius:8px;">
          <h2 style="color:#c25e00;">Gmail SMTP Test Successful!</h2>
          <p>This is a verification test email sent from the Citiply Catalogue notification system.</p>
          <p><strong>Configured Sender:</strong> ${user}</p>
          <p><strong>Recipient:</strong> ${recipient}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>
      `
    });

    console.log("✅ Test email delivered successfully!");
    console.log("Message ID:", info.messageId);
  } catch (error) {
    console.error("❌ Gmail SMTP verification failed:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

void runTest();
