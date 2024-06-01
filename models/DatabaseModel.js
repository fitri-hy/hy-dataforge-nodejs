const mysql = require('mysql2');

function createConnection(config) {
  const db = mysql.createConnection(config);

  db.connect((err) => {
    if (err) {
      console.error('Error connecting to database:', err);
      return null;
    }
    console.log('Connected to database.');
  });

  return db;
}

module.exports = createConnection;
