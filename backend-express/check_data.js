const { MongoClient } = require('mongodb');const { MongoClient } = require('mongodb');



async function getCurrentActiveUser(db) {async function checkRecentData() {

  try {  const client = new MongoClient('mongodb://localhost:27017');

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);  await client.connect();

    const recentActivity = await db.collection('application_activity')  const db = client.db('employee360');

      .findOne(

        { timestamp: { $gte: fiveMinutesAgo } },  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        { sort: { timestamp: -1 } }  console.log('24 hours ago:', twentyFourHoursAgo.toISOString());

      );

  const recentCount = await db.collection('application_activity').countDocuments({

    if (recentActivity) {    timestamp: { $gte: twentyFourHoursAgo }

      return recentActivity.user_id;  });

    }  console.log('Documents in last 24 hours:', recentCount);



    const latestActivity = await db.collection('application_activity')  const recentWithDuration = await db.collection('application_activity').countDocuments({

      .findOne({}, { sort: { timestamp: -1 } });    timestamp: { $gte: twentyFourHoursAgo },

    duration_seconds: { $ne: null }

    return latestActivity ? latestActivity.user_id : 'Admin';  });

  } catch (error) {  console.log('Documents in last 24 hours with duration_seconds:', recentWithDuration);

    console.error('Error getting current active user:', error);

    return 'Admin';  const recentNullDuration = await db.collection('application_activity').countDocuments({

  }    timestamp: { $gte: twentyFourHoursAgo },

}    duration_seconds: null

  });

async function checkRecentData() {  console.log('Documents in last 24 hours with null duration_seconds:', recentNullDuration);

  const client = new MongoClient('mongodb://localhost:27017');

  await client.connect();  // Get total time calculation

  const db = client.db('employee360');  const pipeline = [

    { $match: { timestamp: { $gte: twentyFourHoursAgo } } },

  const currentUser = await getCurrentActiveUser(db);    {

  console.log('Current active user from API logic:', currentUser);      $group: {

        _id: null,

  const userCount = await db.collection('application_activity').distinct('user_id');        total_time: {

  console.log('All user_ids in database:', userCount);          $sum: {

            $cond: [

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);              { $and: [{ $ne: ['$duration_seconds', null] }, { $gt: ['$duration_seconds', 0] }] },

  console.log('24 hours ago:', twentyFourHoursAgo.toISOString());              '$duration_seconds',

              60

  const recentCount = await db.collection('application_activity').countDocuments({            ]

    timestamp: { $gte: twentyFourHoursAgo }          }

  });        }

  console.log('Documents in last 24 hours:', recentCount);      }

    }

  const recentCountForUser = await db.collection('application_activity').countDocuments({  ];

    user_id: currentUser,

    timestamp: { $gte: twentyFourHoursAgo }  const result = await db.collection('application_activity').aggregate(pipeline).toArray();

  });  const totalSeconds = result[0]?.total_time || 0;

  console.log('Documents in last 24 hours for user', currentUser + ':', recentCountForUser);  const totalHours = totalSeconds / 3600;

  console.log('Total time calculation:', totalSeconds, 'seconds =', totalHours, 'hours');

  const recentWithDuration = await db.collection('application_activity').countDocuments({

    timestamp: { $gte: twentyFourHoursAgo },  await client.close();

    duration_seconds: { $ne: null }}

  });

  console.log('Documents in last 24 hours with duration_seconds:', recentWithDuration);checkRecentData().catch(console.error);

  const recentNullDuration = await db.collection('application_activity').countDocuments({
    timestamp: { $gte: twentyFourHoursAgo },
    duration_seconds: null
  });
  console.log('Documents in last 24 hours with null duration_seconds:', recentNullDuration);

  // Get total time calculation
  const pipeline = [
    { $match: { user_id: currentUser, timestamp: { $gte: twentyFourHoursAgo } } },
    {
      $group: {
        _id: null,
        total_time: {
          $sum: {
            $cond: [
              { $and: [{ $ne: ['$duration_seconds', null] }, { $gt: ['$duration_seconds', 0] }] },
              '$duration_seconds',
              60
            ]
          }
        }
      }
    }
  ];

  const result = await db.collection('application_activity').aggregate(pipeline).toArray();
  const totalSeconds = result[0]?.total_time || 0;
  const totalHours = totalSeconds / 3600;
  console.log('Total time calculation for user', currentUser + ':', totalSeconds, 'seconds =', totalHours, 'hours');

  await client.close();
}

checkRecentData().catch(console.error);