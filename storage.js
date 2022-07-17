// storage connection
const admin = require('./firebaseCert');
const storage = admin.storage();

module.exports = storage;
console.log('storage connected✅')
