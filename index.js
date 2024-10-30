require("dotenv").config();
const { Telegraf } = require("telegraf");
const express = require("express");
const randomUUID = require("crypto");
const app = express();

// Initialize bot with your token
const bot = new Telegraf(process.env.BOT_TOKEN);

// Configure your payment provider token
const PAYMENT_PROVIDER_TOKEN = process.env.PAYMENT_PROVIDER_TOKEN;

const NGROK_URL = process.env.NGROK_URL;

// Middleware to parse JSON bodies
app.use(express.json());

// Store for tracking payments (in production, use a database)
const paymentTracker = new Map();

// Start command
bot.command("start", (ctx) => {
  console.log("welcome");
  ctx.reply("Welcome to the payment bot! Use /buy to make a purchase.");
});

// Buy command to initiate payment
bot.command("buy", async (ctx) => {
  const chatId = ctx.from.id;
  const amount = 1;
  const product = "Premium-version";
  // const payload = randomUUID();

  try {
    await ctx.telegram.sendInvoice(chatId, {
      currency: "XTR",
      prices: [{ label: product, amount }],
      title: product,
      provider_token: "",
      description: `Fantastic opportunities!`,
      payload: {
        unique_id: `${ctx.from.id}_${Date.now()}`,
        user_id: ctx.from.id,
      },
      photo_url:
        "https://storage.googleapis.com/untukmu/foru/ForU_Cat_BotStart.jpeg",
      photo_width: 150,
      photo_height: 150,
      start_parameter: "no_pay",
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    ctx.reply("Sorry, there was an error creating your invoice.");
  }

  // try {
  //   const invoice = {
  //     provider_token: "",
  //     start_parameter: "stars-payment",
  //     title: "Telegram Stars Purchase",
  //     description: "Purchase Telegram Stars",
  //     currency: "XTR",
  //     prices: [{ label: "Stars Package", amount: 1 }],
  //     payload: {
  //       unique_id: `${ctx.from.id}_${Date.now()}`,
  //       user_id: ctx.from.id,
  //     },
  //   };

  //   await ctx.replyWithInvoice(invoice);
  // } catch (error) {
  //   console.error("Error creating invoice:", error);
  //   ctx.reply("Sorry, there was an error creating your invoice.");
  // }
});

bot.on("pre_checkout_query", (ctx) => {
  console.log("precheckout");
  // ctx.answerPreCheckoutQuery(true);
});

// Pre-checkout handler
// bot.on("pre_checkout_query", async (ctx) => {
//   console.log("pre_checkout_query received");

//   onPreCheckout(ctx);

//   // try {
//   //   const { id, invoice_payload } = ctx.preCheckoutQuery;

//   //   // Verify the payment payload
//   //   const payloadData = JSON.parse(invoice_payload);
//   //   if (!payloadData.user_id) {
//   //     await ctx.answerPreCheckoutQuery(false, "Invalid payment payload");
//   //     return;
//   //   }

//   //   // Track the pending payment
//   //   paymentTracker.set(payloadData.unique_id, {
//   //     status: "pending",
//   //     timestamp: Date.now(),
//   //   });

//   //   await ctx.answerPreCheckoutQuery(true);
//   // } catch (error) {
//   //   console.error("Pre-checkout error:", error);
//   //   await ctx.answerPreCheckoutQuery(false, "Payment verification failed");
//   // }
// });

async function onPreCheckout(ctx) {
  const { id, invoice_payload } = ctx.preCheckoutQuery;

  const payloadData = JSON.parse(invoice_payload);

  constole.log("payloadData " + payloadData);

  // here you can check if this invoice can be fulfilled
  // const invoice = await getInvoiceFromDatabase(invoice_payload);
  // try {
  //   await ctx.telegram.answerPreCheckoutQuery(id, true);
  // } catch (e) {
  //   // handle error
  //   throw e;
  // }
}

// Successful payment handler
bot.on("successful_payment", async (ctx) => {
  try {
    const { telegram } = ctx;
    const paymentInfo = ctx.message.successful_payment;
    const payloadData = JSON.parse(paymentInfo.invoice_payload);

    // Update payment status
    paymentTracker.set(payloadData.unique_id, {
      status: "completed",
      timestamp: Date.now(),
      amount: paymentInfo.total_amount,
      currency: paymentInfo.currency,
    });

    // Send confirmation message
    await telegram.sendMessage(
      ctx.from.id,
      `Payment successful! 🎉\nAmount: ${paymentInfo.total_amount / 100} ${
        paymentInfo.currency
      }\nThank you for your purchase!`
    );

    // Here you would typically:
    // 1. Update user's stars balance in your database
    // 2. Send notification to admin
    // 3. Generate receipt or update transaction records
  } catch (error) {
    console.error("Payment processing error:", error);
    await ctx.reply(
      "Payment received but there was an error processing it. Please contact support."
    );
  }
});

// Webhook handler for Telegram updates
app.post("/webhook", (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

// Payment status endpoint
app.get("/payment-status/:paymentId", (req, res) => {
  const payment = paymentTracker.get(req.params.paymentId);
  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }
  res.json(payment);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(
    "Set your webhook URL in Telegram: https://api.telegram.org/bot7943892184:AAElSqIpcDCZ3pIeTSq-3ggkIKkUWr5uLlo/setWebhook?url=<server url>/webhook"
  );
});

module.exports = app;
