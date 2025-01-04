const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./db');
const multer = require('multer');
const path = require('path');
const app = express();
const port = 3000;
const nodemailer = require('nodemailer');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

// Function to create transporter dynamically
const createTransporter = (user, pass) => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
    });
};

// Define the email options
const generateMailOptions = (from, to) => {
    return {
        from: from, // Sender address
        to: to, // List of recipients
        subject: 'Test Email from City Engineering Office', // Subject line
        text: 'You have been assigned by your manager, check your CEO account.' // Plain text body
    };
};

// Function to send email
const sendEmail = async (user, pass, to) => {
    try {
        const transporter = createTransporter(user, pass);
        const mailOptions = generateMailOptions(user, to);

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
    } catch (error) {
        console.error('Error occurred:', error);
    }
};

// Endpoint to retrieve the logged-in user's email and send an email
app.post('/send-email', (req, res) => {
    const loggedInUser = req.body.loggedInUser; // Assuming the logged-in user's identifier is sent in the request body

    // Query the database to get the logged-in user's email and password
    const query = 'SELECT email, user_password FROM users WHERE username = ?';
    db.query(query, [loggedInUser], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ message: 'Server error during data retrieval', error: err });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = results[0].email;
        const pass = results[0].user_password;

        // Define recipient email
        const recipientEmail = 'CEO@gmail.com'; // Replace with the actual recipient email

        // Send the email
        sendEmail(user, pass, recipientEmail);
        res.status(200).json({ message: 'Email sent successfully' });
    });
});

// Configure multer for file uploads !NEEDS FIXING
const upload = multer({
    dest: 'uploads/', // Directory to save uploaded files
    limits: { fileSize: 50 * 1024 * 1024 }, // Limit file size to 50MB
    fileFilter: (req, file, cb) => {
        // Accept only certain file types (e.g., DOCX, PPT, images, PDFs)
        const filetypes = /jpeg|jpg|png|pdf|docx|ppt|pptx|doc/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('File upload only supports the following filetypes - ' + filetypes));
    }
});

// Endpoint for file uploads
app.post('/api/upload_file', upload.single('file'), (req, res) => {
    const { row_id, column_id, field } = req.body;
    const filePath = `/uploads/${req.file.filename}`;
    const originalFileName = req.file.originalname;

    if (!row_id || !column_id || !field || !filePath) {
        return res.status(400).json({ message: 'Row ID, column ID, field, and file path are required' });
    }

    const query = `
        INSERT INTO cell_data (row_id, column_id, field, value, original_file_name)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE value = VALUES(value), original_file_name = VALUES(original_file_name)
    `;
    db.query(query, [row_id, column_id, field, filePath, originalFileName], (err, results) => {
        if (err) {
            console.error('Database insert/update error:', err);
            return res.status(500).json({ message: 'Server error during file upload', error: err });
        }
        res.status(200).json({ message: 'File uploaded successfully', filePath: filePath, originalFileName: originalFileName });
    });
});
// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Endpoint to check and create default group and rows
app.get('/api/project/:projectId/default_group', async (req, res) => {
    const projectId = req.params.projectId;
    try {
        const checkGroupQuery = 'SELECT * FROM proj_groups WHERE project_id = ? AND name = "Sample Group"';
        const [groupResult] = await db.promise().query(checkGroupQuery, [projectId]);
        
        if (groupResult.length > 0) {
            return res.status(200).json(groupResult[0]);
        } else {
            const createGroupQuery = 'INSERT INTO proj_groups (project_id, name) VALUES (?, "Sample Group")';
            const [newGroupResult] = await db.promise().query(createGroupQuery, [projectId]);
            const newGroupId = newGroupResult.insertId;

            const createRowQuery = 'INSERT INTO group_rows (group_id) VALUES (?)';
            await db.promise().query(createRowQuery, [newGroupId]);
            await db.promise().query(createRowQuery, [newGroupId]);

            const [newGroup] = await db.promise().query(checkGroupQuery, [projectId]);
            return res.status(201).json(newGroup[0]);
        }
    } catch (error) {
        console.error('Error checking or creating default group:', error);
        return res.status(500).json({ message: 'Server error checking or creating default group', error });
    }
});
// Fetch all users endpoint with optional status filter
app.get('/api/users', (req, res) => {
    const status = req.query.status || 'approved';
    const query = 'SELECT id, first_name, last_name, email, position, created_at, privileges FROM users WHERE status = ?';
    db.query(query, [status], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Server error during users fetch', error: err });
        }
        res.status(200).json(results);
    });
});
    // Update user privileges endpoint
    app.put('/api/users/:id/privileges', (req, res) => {
        const userId = req.params.id;
        const { privileges } = req.body;
    
        const query = 'UPDATE users SET privileges = ? WHERE id = ?';
        db.query(query, [JSON.stringify(privileges), userId], (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Server error during privileges update', error: err });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.status(200).json({ message: 'Privileges updated successfully' });
        });
    });

// Update user endpoint
app.put('/api/users/:id', async (req, res) => {
    const userId = req.params.id;
    const { first_name, last_name, email, position, password } = req.body;

    try {
        // Check if the user is being changed to admin
        if (position === 'admin') {
            // Count the number of admins
            const adminCountQuery = 'SELECT COUNT(*) AS adminCount FROM users WHERE position = "admin"';
            const [adminCountResult] = await db.promise().query(adminCountQuery);
            const adminCount = adminCountResult[0].adminCount;

            // If there's already an admin and the user being updated is not the same user, return an error
            const userQuery = 'SELECT position FROM users WHERE id = ?';
            const [userResult] = await db.promise().query(userQuery, [userId]);
            const user = userResult[0];

            if (adminCount >= 1 && user.position !== 'admin') {
                return res.status(400).json({ message: 'Only one admin is allowed.' });
            }
        }

        // Hash the password if it's provided
        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // Update the user
        const updateUserQuery = `
            UPDATE users 
            SET first_name = ?, last_name = ?, email = ?, position = ?, user_password = COALESCE(?, user_password)
            WHERE id = ?`;
        const values = [first_name, last_name, email, position, hashedPassword, userId];

        const [updateResult] = await db.promise().query(updateUserQuery, values);

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Delete user endpoint
app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id;

    const query = 'DELETE FROM users WHERE id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Database delete error:', err);
            return res.status(500).json({ message: 'Server error during user deletion', error: err });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    });
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
    const { firstName, lastName, email, password, position } = req.body;
    console.log('Received registration request:', req.body);

    // Check if email already exists
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error('Database query error during email check:', err);
            return res.status(500).json({ message: 'Server error during email check' });
        }
        if (results.length > 0) {
            console.log('User already exists:', email);
            return res.status(400).json({ message: 'User already exists' });
        }

        // Check the number of existing admin users
        if (position === 'admin') {
            db.query('SELECT COUNT(*) AS adminCount FROM users WHERE position = "admin"', async (err, countResults) => {
                if (err) {
                    console.error('Database query error during admin count check:', err);
                    return res.status(500).json({ message: 'Server error during admin count check' });
                }
                const adminCount = countResults[0].adminCount;
                if (adminCount >= 1) {
                    console.log('Admin registration limit reached');
                    return res.status(400).json({ message: 'Admin registration limit reached. Only 1 admin is allowed.' });
                }

                // Proceed with user registration with status 'approved'
                try {
                    const hashedPassword = await bcrypt.hash(password, 10);
                    console.log('Password hashed successfully');
                    db.query(
                        'INSERT INTO users (first_name, last_name, email, user_password, position, status) VALUES (?, ?, ?, ?, ?, ?)',
                        [firstName, lastName, email, hashedPassword, position, 'approved'],
                        (err, results) => {
                            if (err) {
                                console.error('Database insert error:', err);
                                return res.status(500).json({ message: 'Server error during user registration' });
                            }
                            console.log('Admin user registered successfully:', email);
                            res.status(201).json({ message: 'Admin user registered successfully.' });
                        }
                    );
                } catch (error) {
                    console.error('Error during password hashing:', error);
                    res.status(500).json({ message: 'Server error during password hashing' });
                }
            });
        } else {
            // Proceed with user registration for non-admin users with status 'pending'
            try {
                const hashedPassword = await bcrypt.hash(password, 10);
                console.log('Password hashed successfully');
                db.query(
                    'INSERT INTO users (first_name, last_name, email, user_password, position, status) VALUES (?, ?, ?, ?, ?, ?)',
                    [firstName, lastName, email, hashedPassword, position, 'pending'],
                    (err, results) => {
                        if (err) {
                            console.error('Database insert error:', err);
                            return res.status(500).json({ message: 'Server error during user registration' });
                        }
                        console.log('User registered successfully:', email);
                        res.status(201).json({ message: 'User registered successfully. Awaiting admin approval.' });
                    }
                );
            } catch (error) {
                console.error('Error during password hashing:', error);
                res.status(500).json({ message: 'Server error during password hashing' });
            }
        }
    });
});

// Admin approval endpoint
app.put('/api/approve-user/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const query = 'UPDATE users SET status = ? WHERE id = ?';
        const values = ['approved', userId];

        db.query(query, values, (err, results) => {
            if (err) {
                console.error('Database update error:', err);
                return res.status(500).json({ message: 'Internal server error', error: err });
            }

            if (results.affectedRows === 0) {
                console.log(`No user found with ID: ${userId}`);
                return res.status(404).json({ message: 'User not found' });
            }

            console.log(`User with ID: ${userId} approved successfully`);
            res.json({ message: 'User approved successfully' });
        });
    } catch (error) {
        console.error('Error approving user:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Received login request:', req.body);

    // Check if the user exists
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error('Database query error during login:', err);
            return res.status(500).json({ message: 'Server error during login' });
        }
        if (results.length === 0) {
            console.log('User not found:', email);
            return res.status(400).json({ message: 'Incorrect email or password' });
        }

        const user = results[0];

        if (user.status !== 'approved') {
            console.log('User not approved:', email);
            return res.status(403).json({ message: 'User not approved yet. Please wait for admin approval.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.user_password);
        if (!isPasswordValid) {
            console.log('Invalid password for user:', email);
            return res.status(400).json({ message: 'Incorrect email or password' });
        }

        // Return user details including position
        res.status(200).json({ user: { email: user.email, position: user.position } });
    });
});

// Create project endpoint
app.post('/api/create_project', (req, res) => {
    const { project_name, project_location, project_description } = req.body;
    console.log('Received project creation request:', { project_name, project_location, project_description });
    if (!project_name || !project_location) {
        return res.status(400).json({ message: 'Project name and location are required' });
    }
    const query = 'INSERT INTO projects (project_name, project_location, project_description) VALUES (?, ?, ?)';
    db.query(query, [project_name, project_location, project_description || ''], (err, results) => {
        if (err) {
            console.error('Database insert error:', err);
            return res.status(500).json({ message: 'Server error during project creation', error: err });
        }
        console.log('Project created successfully:', results);
        res.status(201).json({ message: 'Project created successfully', projectId: results.insertId });
    });
});

// Fetch projects endpoint
app.get('/api/projects', (req, res) => {
    const query = 'SELECT project_id, project_name, project_location, project_description, project_completion, archived, created_at FROM projects';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database fetch error:', err);
            return res.status(500).json({ message: 'Server error during project fetch', error: err });
        }
        res.status(200).json(results);
    });
});

    
    // Delete project endpoint
    app.delete('/api/delete_project/:projectId', (req, res) => {
        const projectId = req.params.projectId;
        const query = 'DELETE FROM projects WHERE project_id = ?';

        db.query(query, [projectId], (err, result) => {
            if (err) {
                console.error('Error deleting project:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Project not found' });
            }

            res.status(200).json({ message: 'Project deleted successfully' });
        });
    });

    // Update project endpoint
    app.put('/api/update_project/:projectId', (req, res) => {
        const projectId = req.params.projectId;
        const { project_name, project_location, project_description } = req.body;
        const query = 'UPDATE projects SET project_name = ?, project_location = ?, project_description = ? WHERE project_id = ?';

        db.query(query, [project_name, project_location, project_description, projectId], (err, result) => {
            if (err) {
                console.error('Error updating project:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Project not found' });
            }

            res.status(200).json({ message: 'Project updated successfully' });
        });
    });

// Fetch project details endpoint
app.get('/api/project/:id', (req, res) => {
    const projectId = req.params.id;
    const query = 'SELECT project_name, project_description FROM projects WHERE project_id = ?';
    db.query(query, [projectId], (err, results) => {
        if (err) {
            console.error('Database fetch error:', err);
            return res.status(500).json({ message: 'Server error during project fetch', error: err });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.status(200).json(results[0]);
    });
});
// Archive project endpoint
app.put('/api/archive_project/:projectId', (req, res) => {
    const projectId = req.params.projectId;
    const query = 'UPDATE projects SET archived = TRUE WHERE project_id = ?';
    db.query(query, [projectId], (err, result) => {
        if (err) {
            console.error('Database update error:', err); // Log the error
            return res.status(500).json({ message: 'Server error during project update', error: err });
        }
        if (result.affectedRows === 0) {
            console.error('No project found with the given ID.'); // Log if no project is found
            return res.status(404).json({ message: 'Project not found.' });
        }
        res.status(200).json({ message: 'Project archived successfully' });
    });
});
// Unarchive project endpoint
app.put('/api/unarchive_project/:projectId', (req, res) => {
    const projectId = req.params.projectId;
    const query = 'UPDATE projects SET archived = FALSE WHERE project_id = ?';
    db.query(query, [projectId], (err, result) => {
        if (err) {
            console.error('Database update error:', err); // Log the error
            return res.status(500).json({ message: 'Server error during project update', error: err });
        }
        if (result.affectedRows === 0) {
            console.error('No project found with the given ID.'); // Log if no project is found
            return res.status(404).json({ message: 'Project not found.' });
        }
        res.status(200).json({ message: 'Project unarchived successfully' });
    });
});

// Create a group
app.post('/api/proj_groups', (req, res) => {
    const { project_id, name } = req.body;
    console.log('Received request to create group:', req.body); // Debug log

    if (!project_id || !name) {
        console.log('Project ID or group name is missing'); // Debug log
        return res.status(400).json({ message: 'Project ID and group name are required' });
    }

    // Use backticks to escape the `groups` table name
    const query = 'INSERT INTO proj_groups (project_id, name) VALUES (?, ?)';
    db.query(query, [project_id, name], (err, results) => {
        if (err) {
            console.error('Database insert error:', err); // Debug log
            return res.status(500).json({ message: 'Server error during group creation', error: err });
        }
        console.log('Group created successfully:', results); // Debug log
        res.status(201).json({ id: results.insertId, message: 'Group created successfully' });
    });
});

    //   a column to a group
    app.post('/api/group_columns', (req, res) => {
        const { group_id, name, type } = req.body;
        if (!group_id || !name || !type) {
            return res.status(400).json({ message: 'Group ID, column name, and type are required' });
        }

        // Insert the column without checking for duplicates
        const query = 'INSERT INTO group_columns (group_id, name, type) VALUES (?, ?, ?)';
        db.query(query, [group_id, name, type], (err, results) => {
            if (err) {
                console.error('Database insert error:', err);
                return res.status(500).json({ message: 'Server error during column creation', error: err });
            }
            res.status(201).json({ id: results.insertId, message: 'Column added successfully' });
        });
    });

    // Add a row to a group
    app.post('/api/group_rows', (req, res) => {
        const { group_id } = req.body;
        if (!group_id) {
            return res.status(400).json({ message: 'Group ID is required' });
        }
        const query = 'INSERT INTO group_rows (group_id) VALUES (?)';
        db.query(query, [group_id], (err, results) => {
            if (err) {
                console.error('Database insert error:', err);
                return res.status(500).json({ message: 'Server error during row creation', error: err });
            }
            res.status(201).json({ id: results.insertId, message: 'Row added successfully' });
        });
    });

    // Endpoint for saving cell data and sending notification emails
    app.post('/api/cell_data', (req, res) => {
        const { row_id, column_id, field, value, email, password } = req.body;

        if (!row_id || !column_id || !field || !value || !email || !password) {
            return res.status(400).json({ message: 'Row ID, column ID, field, value, email, and password are required' });
        }

        const query = `
            INSERT INTO cell_data (row_id, column_id, field, value)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE value = VALUES(value)
        `;
        db.query(query, [row_id, column_id, field, value], (err, results) => {
            if (err) {
                console.error('Database insert/update error:', err);
                return res.status(500).json({ message: 'Server error during data save', error: err });
            }

            // Send email notification if the field is "Key Persons" and the email is a Gmail address
            if (field === 'Key Persons' && /^[a-zA-Z0-9._%+-]+@gmail.com$/.test(value)) {
                const transporter = createTransporter(email, password);
                const mailOptions = {
                    from: email,                     // Sender address
                    to: value,                       // List of recipients
                    subject: 'Notification from Your Website', // Subject line
                    text: `You have been added as a key person on our website by ${email}.` // Plain text body
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Error sending email:', error);
                        return res.status(500).json({ message: 'Error sending email', error: error });
                    }
                    console.log('Email sent:', info.response);
                });
            }

            res.status(200).json({ message: 'Data saved successfully' });
        });
    });


    // Fetch all groups for a project
    app.get('/api/project/:projectId/groups', (req, res) => {
        const projectId = req.params.projectId;
        const query = 'SELECT id, name FROM proj_groups WHERE project_id = ?';
        db.query(query, [projectId], (err, results) => {
            if (err) {
                console.error('Database fetch error:', err);
                return res.status(500).json({ message: 'Server error during groups fetch', error: err });
            }
            res.status(200).json(results);
        });
    });

    // Fetch all rows for a group
    app.get('/api/group/:groupId/rows', (req, res) => {
        const groupId = req.params.groupId;
        const query = 'SELECT * FROM group_rows WHERE group_id = ?';
        db.query(query, [groupId], (err, results) => {
            if (err) {
                console.error('Database fetch error:', err);
                return res.status(500).json({ message: 'Server error during rows fetch', error: err });
            }
            res.status(200).json(results);
        });
    });

    // Endpoint to delete a group
    app.delete('/api/group/:groupId', (req, res) => {
        const groupId = req.params.groupId;
        // First, delete the associated rows and columns (if any)
        const deleteRowsQuery = 'DELETE FROM group_rows WHERE group_id = ?';
        const deleteColumnsQuery = 'DELETE FROM group_columns WHERE group_id = ?';
        const deleteGroupQuery = 'DELETE FROM proj_groups WHERE id = ?';
        db.query(deleteRowsQuery, [groupId], (err, results) => {
            if (err) {
                console.error('Database delete error (rows):', err);
                return res.status(500).json({ message: 'Server error during rows deletion', error: err });
            }
            db.query(deleteColumnsQuery, [groupId], (err, results) => {
                if (err) {
                    console.error('Database delete error (columns):', err);
                    return res.status(500).json({ message: 'Server error during columns deletion', error: err });
                }
                db.query(deleteGroupQuery, [groupId], (err, results) => {
                    if (err) {
                        console.error('Database delete error (group):', err);
                        return res.status(500).json({ message: 'Server error during group deletion', error: err });
                    }
                    res.status(200).json({ message: 'Group deleted successfully' });
                });
            });
        });
    });

    // Endpoint to delete a row
    app.delete('/api/group_row/:rowId', (req, res) => {
        const rowId = req.params.rowId;

        const deleteRowQuery = 'DELETE FROM group_rows WHERE id = ?';
        const deleteCellDataQuery = 'DELETE FROM cell_data WHERE row_id = ?';

        db.query(deleteCellDataQuery, [rowId], (err, results) => {
            if (err) {
                console.error('Database delete error (cell data):', err);
                return res.status(500).json({ message: 'Server error during cell data deletion', error: err });
            }

            db.query(deleteRowQuery, [rowId], (err, results) => {
                if (err) {
                    console.error('Database delete error (row):', err);
                    return res.status(500).json({ message: 'Server error during row deletion', error: err });
                }

                res.status(200).json({ message: 'Row deleted successfully' });
            });
        });
    });

    // Fetch all columns for a group
    app.get('/api/group/:groupId/columns', (req, res) => {
    const groupId = req.params.groupId;
    const query = 'SELECT id, name, type FROM group_columns WHERE group_id = ?';
    db.query(query, [groupId], (err, results) => {
        if (err) {
            console.error('Database fetch error:', err);
            return res.status(500).json({ message: 'Server error during columns fetch', error: err });
        }
        res.status(200).json(results);
        });
    });

    // Fetch all cell data for a group
    app.get('/api/group/:groupId/cell_data', (req, res) => {
        const groupId = req.params.groupId;
        const query = `
            SELECT cd.row_id, cd.column_id, cd.field, cd.value, cd.start_date, cd.due_date
            FROM cell_data cd
            JOIN group_rows gr ON cd.row_id = gr.id
            WHERE gr.group_id = ?
        `;
        db.query(query, [groupId], (err, results) => {
            if (err) {
                console.error('Database fetch error:', err);
                return res.status(500).json({ message: 'Server error during cell data fetch', error: err });
            }
            res.status(200).json(results);
        });
    });
    // Endpoint to update column name
    app.put('/api/group_column/:columnId', (req, res) => {
        const columnId = req.params.columnId;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Column name is required' });
        }

        const query = 'UPDATE group_columns SET name = ? WHERE id = ?';
        db.query(query, [name, columnId], (err, results) => {
            if (err) {
                console.error('Database update error:', err);
                return res.status(500).json({ message: 'Server error during column name update', error: err });
            }

            res.status(200).json({ message: 'Column name updated successfully' });
        });
    });


// Fetch user profile endpoint
app.get('/api/user/profile', (req, res) => {
    const userEmail = req.query.email; // Assume email is passed as a query parameter
    if (!userEmail) {
        return res.status(400).json({ message: 'Email is required' });
    }
    const query = 'SELECT first_name, last_name, email, position FROM users WHERE email = ?';
    db.query(query, [userEmail], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Server error during user profile fetch', error: err });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(results[0]);
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});