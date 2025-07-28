-- Users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL
);

-- Restaurants table
CREATE TABLE restaurants (
    restaurant_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    location VARCHAR(100)
);

-- Menu table
CREATE TABLE menu (
    item_id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(restaurant_id),
    item_name VARCHAR(100),
    category VARCHAR(50),  -- e.g., 'Curries', 'Fried Rice'
    price NUMERIC(5,2)
);

-- Orders table
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    restaurant_id INTEGER REFERENCES restaurants(restaurant_id),
    total_price NUMERIC(6,2),
    order_status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items table
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id),
    item_id INTEGER REFERENCES menu(item_id),
    quantity INTEGER
);

-- Delivery Partners table
CREATE TABLE delivery (
    partner_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    phone VARCHAR(15),
    is_available BOOLEAN DEFAULT TRUE
);
