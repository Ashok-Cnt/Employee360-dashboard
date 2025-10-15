const { MongoClient } = require('mongodb');

async function update() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('employee360');

  const result = await db.collection('application_activity').updateMany(
    { user_id: { $exists: false } },
    { $set: { user_id: 'Admin' } }
  );

  console.log('Updated documents without user_id:', result.modifiedCount);

  const nullResult = await db.collection('application_activity').updateMany(
    { user_id: null },
    { $set: { user_id: 'Admin' } }
  );

  console.log('Updated documents with null user_id:', nullResult.modifiedCount);

  // Also update documents with undefined application
  const appResult = await db.collection('application_activity').updateMany(
    { application: { $exists: false } },
    { $set: { application: 'Unknown Application' } }
  );

  console.log('Updated documents without application:', appResult.modifiedCount);

  await client.close();
}

update().catch(console.error);