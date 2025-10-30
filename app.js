import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import mysql from "mysql2";
import bcrypt from "bcryptjs";
import { check, validationResult } from "express-validator";
import { fileURLToPath } from "url";
import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.static(path.join(__dirname, "static")));

const db = mysql.createPool({
  host: process.env.MYSQL_ADDON_HOST,
  user: process.env.MYSQL_ADDON_USER,
  password: process.env.MYSQL_ADDON_PASSWORD,
  database: process.env.MYSQL_ADDON_DB,
  port: process.env.MYSQL_ADDON_PORT || 3306,
  connectionLimit: 2
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    return;
  }
  console.log('Connected to MySQL database.');
  connection.release();
});

const usersTable = `CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
)`;

db.query(usersTable);

const productsTable = `CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price INT NOT NULL
)`;

db.query(productsTable);

// Insert products if not exists
const insertProducts = `
INSERT IGNORE INTO products (id, name, price) VALUES
(1, 'Bluetooth Speaker', 110),
(2, 'Smart Phone', 215),
(3, 'Smart Watch', 115),
(4, 'Wireless Headphones', 120),
(5, 'Computer CPU', 2520),
(6, 'Cooker', 230),
(7, 'Electric Cooker', 1330),
(8, 'Curved Monitor', 730),
(9, 'Ear Buds', 130),
(10, 'Electric Extension', 430),
(11, 'Fridge', 2100),
(12, 'Gaming CPU', 3500),
(13, 'Gaming Pads', 3500),
(14, 'Home Theatre', 5500),
(15, 'Laptop Bag', 500),
(16, 'Laptop', 6500),
(17, 'Oven', 500),
(18, 'Play Station', 8500),
(19, 'Router', 1500),
(20, 'Smart TV', 9500)
`;

db.query(insertProducts);

const cartTable = `CREATE TABLE IF NOT EXISTS cart (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
)`;

db.query(cartTable);

const MySQLStore = MySQLStoreFactory(session);
const sessionStore = new MySQLStore({}, db);

app.use(session({
  secret: process.env.SESSION_SECRET || 'SUPER_SECRET_KEY_CHANGE_THIS',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 86400000
  }
}));

const shortcode = process.env.MPESA_SHORTCODE;
const passkey = process.env.MPESA_PASSKEY;
const consumerKey = process.env.MPESA_CONSUMER_KEY;
const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
const callbackURL = process.env.MPESA_CALLBACK_URL;

async function generateToken() {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const { data } = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { Authorization: `Basic ${auth}` } }
  );
  return data.access_token;
}

app.get("/db-test", (req, res) => {
  db.query("SELECT 1", (err, results) => {
    if (err) {
      console.error("DB test error:", err.message);
      return res.status(500).json({ error: "Database connection failed", details: err.message });
    }
    res.json({ message: "Database connected successfully", results });
  });
});

app.get("/token", async (req, res) => {
  try {
    const token = await generateToken();
    res.json({ token });
  } catch {
    res.status(500).json({ error: "Failed to generate token" });
  }
});

app.post("/stkpush", async (req, res) => {
  try {
    const { phone, amount } = req.body;

    const token = await generateToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const password = Buffer.from(shortcode + passkey + timestamp).toString("base64");

    const stkRequest = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: callbackURL,
      AccountReference: "OnlineShop",
      TransactionDesc: "Checkout Payment",
    };

    const { data } = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      stkRequest,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.json({ message: "Push sent", data });
  } catch (e) {
    console.error("STK Push error:", e.message);
    res.status(500).json({ error: "Failed STK push" });
  }
});

app.post("/register",
  check("name").isLength({ min: 3 }),
  check("email").isEmail(),
  check("password").isLength({ min: 8 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, confirmPassword } = req.body;
    if (password !== confirmPassword) return res.status(400).json({ error: "Passwords do not match" });

    const hashed = await bcrypt.hash(password, 10);

    db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
      if (results.length) return res.status(400).json({ error: "Email exists" });
      db.query("INSERT INTO users SET ?", { name, email, password: hashed });
      res.json({ message: "Registered" });
    });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt:", email);
  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    console.error("DB query error:", JSON.stringify(err));
    if (err) {
      console.error("DB query error:", err.message || err);
      return res.status(500).json({ error: "Something went wrong. Try again later." });
    }
    console.log("DB query results:", JSON.stringify(results));
    if (!results || results.length === 0) {
      console.log("No user found for email:", email);
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const user = results[0];
    bcrypt.compare(password, user.password, (err, match) => {
      console.error("Bcrypt compare error:", JSON.stringify(err));
      if (err) {
        console.error("Bcrypt error:", err.message || err);
        return res.status(500).json({ error: "Something went wrong. Try again later." });
      }
      console.log("Password match:", match);
      if (!match) return res.status(400).json({ error: "Invalid credentials" });
      req.session.user = { id: user.id, email: user.email };
      console.log("Session created:", req.session.user);
      req.session.save((saveErr) => {
        console.error("Session save error:", JSON.stringify(saveErr));
        if (saveErr) {
          console.error("Session save failed:", saveErr.message || saveErr);
          return res.status(500).json({ error: "Something went wrong. Try again later." });
        }
        console.log("Session saved successfully");
        res.json({ message: "Logged in", user: req.session.user });
      });
    });
  });
});

app.post('/cart/add', (req, res) => {
  const user_id = req.session.user?.id || req.body.user_id;
  const product_id = req.body.product_id;
  const quantity = req.body.quantity || 1;
  if (!user_id || !product_id) return res.status(400).json({ error: "Missing data" });
  db.query(
    'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?',
    [user_id, product_id, quantity, quantity]
  );
  res.json({ message: 'Cart updated' });
});

app.get('/api/cart', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Login required" });
  db.query(`
    SELECT c.*, p.price, p.name
    FROM cart c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `, [req.session.user.id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

app.get('/cart', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Login required" });
  db.query(`
    SELECT c.product_id, c.quantity, p.price, p.name
    FROM cart c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `, [req.session.user.id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

app.post('/cart/remove', (req, res) => {
  const user_id = req.session.user?.id;
  const product_id = req.body.product_id;
  db.query('DELETE FROM cart WHERE user_id = ? AND product_id = ?', [user_id, product_id]);
  res.json({ message: 'Removed' });
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: "Logged out" });
  });
});

app.post("/mpesa/callback", (req, res) => {
  console.log("M-Pesa Callback received:", JSON.stringify(req.body, null, 2));
  // Process the callback data here (e.g., update payment status in database)
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  if (req.session.user) return res.redirect("/home");
  res.sendFile(path.join(__dirname, "static", "home.html"));
});
app.get("/home", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.sendFile(path.join(__dirname, "static", "home.html"));
});
app.get("/cart", (req, res) => res.sendFile(path.join(__dirname, "static", "cart.html")));
app.get("/checkout", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.sendFile(path.join(__dirname, "static", "checkout.html"));
});
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "static", "login.html")));
app.get("/register", (req, res) => res.sendFile(path.join(__dirname, "static", "register.html")));

app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(500).json({ error: 'Internal server error', details: String(err) });
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => console.log(`Running on port ${port}`));
