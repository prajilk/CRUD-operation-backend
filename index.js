// Import required modules
const express = require("express"); // Import the Express web framework
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require("body-parser"); // Middleware to parse incoming request bodies


// Create an Express application
const app = express();

// Middleware configuration
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded request bodies
app.use(bodyParser.json());
app.use(express.static("public")); // Serve static files from the "public" directory
const cors = require("cors");

// Import and use the 'cors' middleware to enable Cross-Origin Resource Sharing (CORS) for the application.// 
app.use(cors({
    // Set the allowed origin(s) that can access the server's resources.
    origin: ['http://localhost:5173'],
    credentials: true
}))

// Create an SQLite database connection
const db = new sqlite3.Database('user.db', (err) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Connected to the database.');
        // Create the "users" table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, first_name TEXT NOT NULL, last_name TEXT NOT NULL, dob DATE NOT NULL, address TEXT NOT NULL )`, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            } else {
                console.log('Table "users" created or already exists.');
            }
        });
    }
});

// Route to fetch all users as API
app.get("/users", (req, res) => {

    // Select all records from the "users" table
    const selectQuery = "SELECT * FROM users";

    db.all(selectQuery, (err, rows) => {
        if (err) {
            console.error("Error fetching users:", err.message);
            res.status(500).json({ success: false, message: "Failed to fetch users." });
        } else {
            console.log("Users fetched successfully.");
            res.status(200).json({ success: true, message: "Users fetched successfully.", users: rows }); // Send all users to client
        }
    });
});

app.post('/create-user', (req, res) => {
    // Get all user data
    const firstName = req.body.first_name;
    const lastName = req.body.last_name;
    const dob = req.body.dob;
    const address = req.body.address;

    // Function to generate a random 4-digit number for ID
    const generateRandomId = () => {
        const min = 1000;
        const max = 9999;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    const id = generateRandomId(); // Generate the random ID

    // Insert the data into the "users" table
    const insertQuery = "INSERT INTO users (id, first_name, last_name, dob, address) VALUES (?, ?, ?, ?, ?)";
    db.run(insertQuery, [id, firstName, lastName, dob, address], (err) => {
        if (err) {
            console.error("Error inserting user:", err.message);
            res.status(500).json({ saved: true, message: "Failed to insert user." });
        } else {
            console.log("User inserted successfully.");
            res.status(200).json({ saved: true, message: "User inserted successfully." });
        }
    });
})

app.get('/fetch-user/:userId', (req, res) => {

    // Get user id from params
    const userIdToUpdate = req.params.userId;

    // Query to select all data of the given user id
    const selectQuery = 'SELECT * FROM users WHERE id = ?';

    // Execute the select query with the ID parameter
    db.get(selectQuery, userIdToUpdate, (err, row) => {
        if (err) {
            console.error('Error fetching user:', err.message);
            res.status(500).json({ error: 'An error occurred while fetching the user.' });
        } else {
            if (row) {
                console.log(`User with ID ${userIdToUpdate} found.`);
                res.json({ success: true, user: row });
            } else {
                console.log(`User with ID ${userIdToUpdate} not found.`);
                res.status(404).json({ success: false, message: 'User not found.' });
            }
        }
    });

})

// Route for updating user details
app.post('/update-user/:id', (req, res) => {

    // Get user id from params
    const userId = req.params.id;

    const { first_name, last_name, dob, address } = req.body;

    // Query to update the user with given id
    const sql = `UPDATE users SET first_name = ?, last_name = ?, dob = ?, address = ? WHERE id = ?`;
    const params = [first_name, last_name, dob, address, userId];

    db.run(sql, params, function (err) {
        if (err) {
            // Return failed message
            return res.status(500).json({ updated: false, error: 'Failed to update user details.' });
        }

        // Return success
        res.json({ updated: true, message: 'User details updated successfully.' });
    });
});


// Route to delete user with user ID
app.delete('/delete-user/:userId', (req, res) => {

    // Get user id from params
    const userIdToDelete = req.params.userId;

    // Prepare the delete query with a parameter placeholder
    const deleteQuery = 'DELETE FROM users WHERE id = ?';

    // Execute the delete query with the ID parameter
    db.run(deleteQuery, userIdToDelete, function (err) {
        if (err) {
            console.error('Error deleting user:', err.message);
            res.status(500).json({ success: false, message: "An error occurred while deleting the user." });
        } else {
            console.log(`User with ID ${userIdToDelete} has been deleted.`);
            res.status(200).json({ success: true, message: `User with ID ${userIdToDelete} has been deleted.` }); // Deleted the user with given user id
        }
    });
})

// Start the server and listen on port 3000
app.listen(3000, () => {
    console.log("Server running on port 3000.");
});
