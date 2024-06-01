const express = require('express');
const createConnection = require('../models/DatabaseModel');

const router = express.Router();
let db;
let logs = [];

function checkDbConnection(req, res, next) {
  if (!db) {
    return res.redirect('/connect');
  }
  next();
}

router.get('/connect', (req, res) => {
  res.render('connect');
});

router.post('/connect', (req, res) => {
  const { host, user, password, database } = req.body;

  db = createConnection({ host, user, password, database });

  if (!db) {
    logs.push('Failed to connect to the database.');
    return res.status(500).send('Failed to connect to the database.');
  }

  logs.push('Connected to database.');

  db.query('SHOW TABLES', (err, results) => {
    if (err) {
      logs.push('Error connecting to database');
      return res.status(500).send('Error connecting to database');
    }

    const tables = results.map(row => Object.values(row)[0]);
    res.render('index', { tables, logs });
  });
});

router.get('/logout', (req, res) => {
  if (db) {
    db.end((err) => {
      if (err) {
        logs.push('Error disconnecting from database: ' + err.message);
        console.error('Error disconnecting from database:', err);
      } else {
        logs.push('Disconnected from database.');
        console.log('Disconnected from database.');
      }
      db = null;
      res.redirect('/connect');
    });
  } else {
    res.redirect('/connect');
  }
});

router.get('/', checkDbConnection, (req, res) => {
  db.query('SHOW TABLES', (err, results) => {
    if (err) {
      logs.push('Error fetching tables');
      return res.status(500).send('Error fetching tables');
    }

    const tables = results.map(row => Object.values(row)[0]);
    res.render('index', { tables, logs });
  });
});

router.get('/table/:tableName', checkDbConnection, (req, res) => {
  const tableName = req.params.tableName;

  db.query(`DESCRIBE ${tableName}`, (err, columns) => {
    if (err) {
      logs.push('Error fetching table structure');
      return res.status(500).send('Error fetching table structure');
    }

    db.query(`SELECT * FROM ${tableName} LIMIT 100`, (err, rows) => {
      if (err) {
        logs.push('Error fetching table data');
        return res.status(500).send('Error fetching table data');
      }

      res.render('table-details', { tableName, columns, rows, logs });
    });
  });
});

router.post('/add-table', checkDbConnection, (req, res) => {
  const tableName = req.body.tableName;

  if (!tableName) {
    return res.status(400).send('Invalid input');
  }

  const query = `CREATE TABLE ${tableName} (id INT AUTO_INCREMENT PRIMARY KEY)`;

  db.query(query, (err, result) => {
    if (err) {
      logs.push('Error adding table: ' + err.message);
      console.error('Error adding table:', err);
      return res.redirect('/');
    }
    logs.push('Table added successfully');
    console.log('Table added successfully');
    res.redirect('/');
  });
});

router.post('/delete-table', checkDbConnection, (req, res) => {
  const tableName = req.body.tableName;

  if (!tableName) {
    return res.status(400).send('Invalid input');
  }

  const query = `DROP TABLE ${tableName}`;

  db.query(query, (err, result) => {
    if (err) {
      logs.push('Error deleting table: ' + err.message);
      console.error('Error deleting table:', err);
      return res.redirect('/');
    }
    logs.push('Table deleted successfully');
    console.log('Table deleted successfully');
    res.redirect('/');
  });
});

router.post('/table/:tableName/add-column', checkDbConnection, (req, res) => {
  const tableName = req.params.tableName;
  const { columnName, columnType } = req.body;

  if (!columnName || !columnType) {
    return res.status(400).send('Invalid input');
  }

  const query = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`;

  db.query(query, (err, result) => {
    if (err) {
      logs.push('Error adding column: ' + err.message);
      console.error('Error adding column:', err);
      return res.redirect('/');
    }
    logs.push('Column added successfully');
    console.log('Column added successfully');
    res.redirect(`/table/${tableName}`);
  });
});

router.post('/table/:tableName/delete-column', checkDbConnection, (req, res) => {
  const tableName = req.params.tableName;
  const { columnName } = req.body;

  const query = `ALTER TABLE ${tableName} DROP COLUMN ${columnName}`;

  db.query(query, (err, result) => {
    if (err) {
      logs.push('Error deleting column: ' + err.message);
      console.error('Error deleting column:', err);
      return res.redirect('/');
    }
    logs.push('Column deleted successfully');
    console.log('Column deleted successfully');
    res.redirect(`/table/${tableName}`);
  });
});

router.post('/table/:tableName/insert-data', checkDbConnection, (req, res) => {
  const tableName = req.params.tableName;
  const data = req.body;
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => '?').join(',');

  db.query(`INSERT INTO ${tableName} (${keys.join(',')}) VALUES (${placeholders})`, values, (err, result) => {
    if (err) {
      logs.push('Error inserting data: ' + err.message);
      throw err;
    }
    logs.push('Data inserted successfully.');
    console.log('Data inserted successfully.');
    res.redirect(`/table/${tableName}`);
  });
});

router.post('/table/:tableName/delete-data', checkDbConnection, (req, res) => {
  const tableName = req.params.tableName;
  const id = req.body.id;

  const query = `DELETE FROM ${tableName} WHERE id = ?`;

  db.query(query, [id], (err, result) => {
    if (err) {
      logs.push('Error deleting data: ' + err.message);
      console.error('Error deleting data:', err);
      return res.redirect('/');
    }
    logs.push('Data deleted successfully.');
    console.log('Data deleted successfully.');
    res.redirect(`/table/${tableName}`);
  });
});

module.exports = router;
