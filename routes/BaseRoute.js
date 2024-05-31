const express = require('express');
const db = require('../models/DatabaseModel');

const router = express.Router();

router.get('/', (req, res) => {
  db.query('SHOW TABLES', (err, results) => {
    if (err) {
      return res.status(500).send('Error fetching tables');
    }

    const tables = results.map(row => Object.values(row)[0]);
    res.render('index', { tables });
  });
});

router.get('/table/:tableName', (req, res) => {
  const tableName = req.params.tableName;

  db.query(`DESCRIBE ${tableName}`, (err, columns) => {
    if (err) {
      return res.status(500).send('Error fetching table structure');
    }

    db.query(`SELECT * FROM ${tableName} LIMIT 100`, (err, rows) => {
      if (err) {
        return res.status(500).send('Error fetching table data');
      }

      res.render('table-details', { tableName, columns, rows });
    });
  });
});

router.post('/add-table', (req, res) => {
  const tableName = req.body.tableName;

  if (!tableName) {
    return res.status(400).send('Invalid input');
  }

  const query = `CREATE TABLE ${tableName} (id INT AUTO_INCREMENT PRIMARY KEY)`;

  db.query(query, (err, result) => {
    if (err) {
      console.error('Error adding table:', err);
      return res.status(500).send('Error adding table');
    }
    console.log('Table added successfully');
    res.redirect('/');
  });
});

router.post('/delete-table', (req, res) => {
  const tableName = req.body.tableName;

  if (!tableName) {
    return res.status(400).send('Invalid input');
  }

  const query = `DROP TABLE ${tableName}`;

  db.query(query, (err, result) => {
    if (err) {
      console.error('Error deleting table:', err);
      return res.status(500).send('Error deleting table');
    }
    console.log('Table deleted successfully');
    res.redirect('/');
  });
});


router.post('/table/:tableName/add-column', (req, res) => {
  const tableName = req.params.tableName;
  const { columnName, columnType } = req.body;

  if (!columnName || !columnType) {
    return res.status(400).send('Invalid input');
  }

  const query = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`;

  db.query(query, (err, result) => {
    if (err) {
      console.error('Error adding column:', err);
      return res.status(500).send('Error adding column');
    }
    console.log('Column added successfully');
    res.redirect(`/table/${tableName}`);
  });
});

router.post('/table/:tableName/delete-column', (req, res) => {
  const tableName = req.params.tableName;
  const { columnName } = req.body;

  const query = `ALTER TABLE ${tableName} DROP COLUMN ${columnName}`;

  db.query(query, (err, result) => {
    if (err) {
      console.error('Error deleting column:', err);
      return res.status(500).send('Error deleting column');
    }
    console.log('Column deleted successfully');
    res.redirect(`/table/${tableName}`);
  });
});

router.post('/table/:tableName/insert-data', (req, res) => {
  const tableName = req.params.tableName;
  const data = req.body;
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => '?').join(',');

  db.query(`INSERT INTO ${tableName} (${keys.join(',')}) VALUES (${placeholders})`, values, (err, result) => {
    if (err) throw err;
    console.log('Data inserted successfully.');
    res.redirect(`/table/${tableName}`);
  });
});

router.post('/table/:tableName/delete-data', (req, res) => {
  const tableName = req.params.tableName;
  const id = req.body.id;

  const query = `DELETE FROM ${tableName} WHERE id = ?`;

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error deleting data:', err);
      return res.status(500).send('Error deleting data');
    }
    console.log('Data deleted successfully.');
    res.redirect(`/table/${tableName}`);
  });
});

module.exports = router;
