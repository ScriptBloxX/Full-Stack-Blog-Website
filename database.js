// db connection
const admin = require('./firebaseCert');
const db = admin.firestore();

module.exports = db;
console.log('database connected✅')
