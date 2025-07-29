#Student Kitchens

Student Kitchens is a campus food delivery system built for students to browse menus, place orders, and get food delivered from various on-campus restaurants.

## Features

- Browse available campus restaurants
- View categorized menus for each outlet
- Register/login system for students
- Order tracking with assigned delivery partner
- Admin panel to manage restaurants

##  Tech Stack

**Frontend:**
- HTML, CSS, JavaScript

**Backend:**
- Node.js, Express.js

**Database:**
- PostgreSQL

## 📁 Project Structure
tudent-kitchens/
├── database/
│ └── database.js # Database connection file (ignored via .gitignore)
├── public/
│ └── [HTML/CSS/JS Files]
├── server.js # Backend server (ignored via .gitignore)
├── .gitignore
└── README.md


## 🔐 Environment Variables

Sensitive information like database passwords are **NOT committed** and are managed via environment variables.

Create a `.env` file at the root:

DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_db
DB_USER=your_user
DB_PASSWORD=your_password

