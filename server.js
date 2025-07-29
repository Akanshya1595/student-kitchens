const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

require('dotenv').config(); 

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});


// Login endpoint
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    console.log("Login Attempt:", email, password);
  
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1 AND password = $2',
        [email, password]
      );
  
      if (result.rows.length > 0) {
        const user = result.rows[0];
  
        if (user.is_admin) {
          res.json({
            message: 'Login successful',
            name: user.name,
            email: user.email,
            is_admin: user.is_admin  
          });
        } else {
          res.json({
            message: 'Login successful',
            name: user.name,
            email: user.email
          });
        }
      } else {
        res.status(401).json({ error: 'Invalid email or password' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  

// Registration endpoint
app.post('/register', async (req, res) => {
    const { id, name, email, password, contact = '', address = '', is_admin = false } = req.body; 
  
    try {
      await pool.query(
        'INSERT INTO users (id, name, email, password, contact, address, is_admin) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [id, name, email, password, contact, address, is_admin]
      );
  
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });
  

// Get user profile data
app.get('/user', async (req, res) => {
  const email = req.query.email;

  try {
    const result = await pool.query(
      'SELECT name, email, contact, address FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile data
app.post('/update-profile', async (req, res) => {
  const { email, name, contact, address } = req.body;

  try {
    const result = await pool.query(
      'UPDATE users SET name = $1, contact = $2, address = $3 WHERE email = $4',
      [name, contact, address, email]
    );

    if (result.rowCount > 0) {
      res.json({ message: 'Profile updated successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get restaurants data
app.get('/restaurants', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM restaurants');
      res.json(result.rows); 
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/get-address', async (req, res) => {
    const { email } = req.query;
    
    const result = await pool.query('SELECT address FROM users WHERE email = $1', [email]);
    
    if (result.rows.length > 0) {
        res.json({ address: result.rows[0].address });
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

// Place Order Endpoint
app.post('/place-order', async (req, res) => {
    const {
      user_email,
      restaurant_name,
      items,
      total_amount,
      delivery_address
    } = req.body;
  
    if (!user_email || !restaurant_name || !items || !Array.isArray(items) || !delivery_address) {
      return res.status(400).json({ error: "Invalid request body" });
    }
  
    const client = await pool.connect();
  
    try {
      await client.query('BEGIN');
  
      const partnerResult = await client.query('SELECT partner_id FROM delivery WHERE is_available = TRUE LIMIT 1');
      
      if (partnerResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(503).json({ error: "No delivery partners available" });
      }
  
      const partnerID = partnerResult.rows[0].partner_id;
  
      const query = `
        INSERT INTO order_placed (
          user_email, restaurant_name, items, total_amount, delivery_address, order_time, delivery_partner_id
        ) VALUES ($1, $2, $3, $4, $5, NOW(), $6)
      `;
  
      await client.query(query, [
        user_email,
        restaurant_name,
        JSON.stringify(items),
        total_amount,
        delivery_address,
        partnerID
      ]);
  

      await client.query('UPDATE delivery SET is_available = FALSE WHERE partner_id = $1', [partnerID]);
  
      await client.query('COMMIT');
      res.status(201).json({ message: "Order placed successfully and delivery partner assigned!" });
  
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("Error placing order:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } finally {
      client.release();
    }
  });
  

app.get('/order-history', async (req, res) => {
    const { email } = req.query;
  
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
  
    try {
      const result = await pool.query(`
        SELECT order_id, restaurant_name, total_amount, order_time, items, delivery_address
        FROM order_placed
        WHERE user_email = $1
        ORDER BY order_time DESC
      `, [email]);
  
      if (result.rows.length === 0) {
        return res.status(200).json([]);
      }

      const orders = result.rows.map(order => ({
        ...order,
        food_items: order.items 
      }));
  
      res.status(200).json(orders);
    } catch (error) {
      console.error("Error fetching order history:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

app.post('/admin/addRestaurant', async (req, res) => {
    const { restaurantName, restaurantType, restaurantLocation } = req.body;
  
    if (!restaurantName || !restaurantType || !restaurantLocation) {
      return res.status(400).json({ error: 'All fields are required' });
    }
  
    try {
      await pool.query(
        'INSERT INTO restaurants (name, category, location) VALUES ($1, $2, $3)',
        [restaurantName, restaurantType, restaurantLocation]
      );
      res.status(201).json({ message: 'Restaurant added successfully!' });
    } catch (error) {
      console.error('Error adding restaurant:', error);
      res.status(500).json({ error: 'Failed to add restaurant' });
    }
  });

  app.post('/track-order', async (req, res) => {
    const { email } = req.body;
  
    try {
      const result = await pool.query(
        `SELECT 
           o.*, 
           d.name AS delivery_partner_name,
           d.phone AS delivery_partner_phone
         FROM order_placed o
         LEFT JOIN delivery d 
           ON o.delivery_partner_id = d.partner_id
         WHERE o.user_email = $1
         ORDER BY o.order_time DESC 
         LIMIT 1`,
        [email]
      );
  
      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(404).json({ error: 'No recent order found' });
      }
    } catch (err) {
      console.error("Error in /track-order:", err);
      res.status(500).json({ error: 'Server error' });
    }
    try {
        const result = await pool.query(
            `SELECT * FROM order_placed WHERE user_email = $1 ORDER BY order_time DESC LIMIT 1`,
            [email]
        );

        if (result.rows.length > 0) {
            const order = result.rows[0];
            
            await pool.query(
                `INSERT INTO order_tracking (user_email, restaurant_name, delivery_address, total_amount, delivery_partner_name) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [email, order.restaurant_name, order.delivery_address, order.total_amount, 'Rahul Bajaj']
            );

            res.json(order);
        } else {
            res.status(404).json({ error: 'No recent order found' });
        }
    } catch (err) {
        console.error("Error in /track-order:", err);
        res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/get-order-total', async (req, res) => {
    const { email } = req.body; 

    try {
        const result = await pool.query(
            `SELECT total_amount FROM order_placed WHERE user_email = $1 ORDER BY order_time DESC LIMIT 1`,
            [email]
        );

        if (result.rows.length > 0) {
            res.json({ total_amount: result.rows[0].total_amount });
        } else {
            res.status(404).json({ error: "No active orders found" });
        }
    } catch (err) {
        console.error("Error in /get-order-total:", err);
        res.status(500).json({ error: "Server error" });
    }
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
