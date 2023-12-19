const express = require("express");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.use(bodyParser.json());

// MySQL database connection setup
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "userdb",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

// RESTful endpoint for user sign-up
app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  // Hash the password before storing it in the database
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = {
    username,
    email,
    password: hashedPassword,
    // password,
  };

  // Insert user data into the database
  db.query("INSERT INTO users SET ?", user, (err, result) => {
    if (err) {
      // Handle duplicate email error
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ error: "Email already exists" });
      }
      console.error("Error during sign-up:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    res.status(201).json({ message: "User signed up successfully" });
  });
});

// RESTful endpoint for user login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);

  console.log(email);
  console.log(password);

  // Retrieve user data from the database based on the provided email
  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) {
        console.error("Error during login:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      // Check if the user exists
      if (results.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = results[0];

      // Compare the provided password with the hashed password in the database
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json({ message: "Login successful" });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
