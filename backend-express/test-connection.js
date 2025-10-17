const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = "mongodb+srv://employee360:admin@employee360.n05xtqd.mongodb.net/";
const DATABASE_NAME = "employee360";

console.log('Testing MongoDB Atlas connection...');
console.log('URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));
console.log('Database:', DATABASE_NAME);

const client = new MongoClient(MONGODB_URI);

async function testConnection() {
  try {
    console.log('\n📡 Attempting to connect...');
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas successfully!');
    
    const db = client.db(DATABASE_NAME);
    console.log(`✅ Selected database: ${DATABASE_NAME}`);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`\n📚 Found ${collections.length} collections:`);
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Test a simple query
    const users = await db.collection('users').countDocuments();
    console.log(`\n👥 Users collection has ${users} documents`);
    
    await client.close();
    console.log('\n✅ Connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();
