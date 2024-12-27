const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Registration endpoint
app.post('/api/register', async (req, res) => {
    const { firstName, lastName, email, password, position } = req.body;
    console.log('Received registration request:', req.body);
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error('Database query error during email check:', err);
            return res.status(500).json({ message: 'Server error during email check' });
        }
        if (results.length > 0) {
            console.log('User already exists:', email);
            return res.status(400).json({ message: 'User already exists' });
        }
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            console.log('Password hashed successfully');
            db.query(
                'INSERT INTO users (first_name, last_name, email, user_password, position) VALUES (?, ?, ?, ?, ?)',
                [firstName, lastName, email, hashedPassword, position],
                (err, results) => {
                    if (err) {
                        console.error('Database insert error:', err);
                        return res.status(500).json({ message: 'Server error during user registration' });
                    }
                    console.log('User registered successfully:', email);
                    res.status(201).json({ message: 'User registered successfully' });
                }
            );
        } catch (error) {
            console.error('Error during password hashing:', error);
            res.status(500).json({ message: 'Server error during password hashing' });
        }
    });
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    console.log('Received login request:', { email });

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }

        const user = results[0];

        // Compare the provided password with the stored hashed password
        const isPasswordValid = await bcrypt.compare(password, user.user_password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        res.status(200).json({ message: 'Login successful', user });
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
            const query = 'SELECT * FROM projects';
            db.query(query, (err, results) => {
                if (err) {
                    console.error('Database fetch error:', err);
                    return res.status(500).json({ message: 'Server error during project fetch', error: err });
                }
                res.status(200).json(results);
            });
        });
        // Delete project endpoint
        app.delete('/api/delete_project/:id', (req, res) => {
            const projectId = req.params.id;
            db.query('DELETE FROM projects WHERE project_id = ?', [projectId], (err, results) => {
                if (err) {
                    console.error('Database delete error:', err);
                    return res.status(500).json({ message: 'Server error during project deletion', error: err });
                }
                console.log('Project deleted successfully:', results);
                res.status(200).json({ message: 'Project deleted successfully' });
            });
        });
        // Update project name, location, and description endpoint
        app.put('/api/update_project_details/:id', (req, res) => {
            const projectId = req.params.id;
            const { project_name, project_description } = req.body;
            console.log('Received update request for project details:', { projectId, project_name, project_description });

            const query = 'UPDATE projects SET project_name = ?, project_description = ? WHERE project_id = ?';
            db.query(query, [project_name, project_description, projectId], (err, results) => {
                if (err) {
                    console.error('Database update error:', err);
                    return res.status(500).json({ message: 'Server error during project update', error: err });
                }
                console.log('Project details updated successfully:', results);
                res.status(200).json({ message: 'Project details updated successfully' });
            });
        });

// UNDER TEMPLATE: Fetch project details endpoint
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
// Add a column to a group
app.post('/api/group_columns', (req, res) => {
    const { group_id, name, type } = req.body;
    if (!group_id || !name || !type) {
        return res.status(400).json({ message: 'Group ID, column name, and type are required' });
    }
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
// Save cell data
app.post('/api/cell_data', (req, res) => {
    const { row_id, column_id, value } = req.body;
    if (!row_id || !column_id || value === undefined) {
        return res.status(400).json({ message: 'Row ID, column ID, and value are required' });
    }

    const query = `
        INSERT INTO cell_data (row_id, column_id, value)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE value = VALUES(value)
    `;
    db.query(query, [row_id, column_id, value], (err, results) => {
        if (err) {
            console.error('Database insert/update error:', err);
            return res.status(500).json({ message: 'Server error during cell data save', error: err });
        }
        res.status(200).json({ message: 'Cell data saved successfully' });
    });
});
// Fetch all groups for a project
app.get('/api/project/:projectId/groups', (req, res) => {
    const projectId = req.params.projectId;
    const query = 'SELECT * FROM proj_groups WHERE project_id = ?';
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


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});