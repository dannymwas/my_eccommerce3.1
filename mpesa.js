// mpesa.js (CommonJS version)
const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();
const router = express.Router();

/* ============================
   STEP 1: GET ACCESS TOKEN
============================ */
async function getAccessToken() {
  try {
    const url =
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
    const auth = Buffer.from(
      `${process.env.CONSUMER_KEY}:${process.env.CONSUMER_SECRET}`
    ).toString("base64");

    const response = await axios.get(url, {
      headers: { Authorization: `Basic ${auth}` },
    });

    return response.data.access_token;
  } catch (error) {
    console.error(
      "❌ Error getting access token:",
      error.response?.data || error.message
    );
    throw new Error("Failed to get access token");
  }
}

/* ============================
   STEP 2: STK PUSH REQUEST
============================ */
router.post("/stkpush", async (req, res) => {
  try {
    const { phone, amount } = req.body; // From frontend

    const token = await getAccessToken();

    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, -3);

    const password = Buffer.from(
      process.env.SHORTCODE + process.env.PASSKEY + timestamp
    ).toString("base64");

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: process.env.SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: process.env.SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: process.env.CALLBACK_URL,
        AccountReference: "Website Payment",
        TransactionDesc: "Paying for goods on website",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.status(200).json({
      message: "STK Push initiated",
      response: response.data,
    });
  } catch (error) {
    console.error(
      "❌ STK Push error:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: error.message });
  }
});

/* ============================
   STEP 3: CALLBACK HANDLER
============================ */
router.post("/callback", (req, res) => {
  console.log("✅ M-Pesa Callback:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

module.exports = router;
