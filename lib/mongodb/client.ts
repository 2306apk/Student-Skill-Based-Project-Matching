import { MongoClient, Db, Collection } from 'mongodb';
import { ActivityEventType, ActivityLog } from '@/types';

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_skill_project_matching';
const dbName = process.env.MONGODB_DB || 'student_skill_project_matching';

let clientPromise: Promise<MongoClient>;

if (!globalThis.__mongoClientPromise) {
  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });
  globalThis.__mongoClientPromise = client.connect();
}
clientPromise = globalThis.__mongoClientPromise;

export async function getMongoDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

let indexesInitialized = false;

export async function getActivityCollection(): Promise<Collection<ActivityLog>> {
  const db = await getMongoDb();
  const collection = db.collection<ActivityLog>('activity_logs');

  if (!indexesInitialized) {
    try {
      await collection.createIndex({ studentId: 1, timestamp: -1 });
      await collection.createIndex({ projectId: 1, timestamp: -1 });
      await collection.createIndex({ eventType: 1 });
      await collection.createIndex({ timestamp: -1 });
      indexesInitialized = true;
    } catch (err) {
      console.warn('Failed to ensure MongoDB indexes:', err);
    }
  }

  return collection;
}

/**
 * Log an activity event to MongoDB.
 * MongoDB serves as an audit/activity log. If MongoDB logging fails,
 * it logs a warning instead of failing the primary relational transaction.
 */
export async function logActivity(event: {
  eventType: ActivityEventType;
  studentId?: number | null;
  projectId?: number | null;
  userId?: number | null;
  metadata?: Record<string, any>;
}): Promise<boolean> {
  try {
    const collection = await getActivityCollection();
    await collection.insertOne({
      ...event,
      timestamp: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Non-blocking MongoDB activity logging error:', error);
    return false;
  }
}

/**
 * MongoDB Aggregation Pipeline 1: Activity counts grouped by event type.
 */
export async function getEventCountsByType() {
  const col = await getActivityCollection();
  return col
    .aggregate([
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          lastOccurred: { $max: '$timestamp' },
        },
      },
      { $sort: { count: -1 } },
    ])
    .toArray();
}

/**
 * MongoDB Aggregation Pipeline 2: Application activity grouped by project.
 */
export async function getProjectActivityBreakdown() {
  const col = await getActivityCollection();
  return col
    .aggregate([
      { $match: { projectId: { $ne: null } } },
      {
        $group: {
          _id: '$projectId',
          totalEvents: { $sum: 1 },
          events: {
            $push: {
              eventType: '$eventType',
              studentId: '$studentId',
              timestamp: '$timestamp',
            },
          },
        },
      },
      { $sort: { totalEvents: -1 } },
      { $limit: 10 },
    ])
    .toArray();
}

/**
 * MongoDB Aggregation Pipeline 3: Daily activity timeline.
 */
export async function getDailyActivityTrend(days = 14) {
  const col = await getActivityCollection();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return col
    .aggregate([
      {
        $match: {
          timestamp: { $gte: cutoff.toISOString() },
        },
      },
      {
        $project: {
          dateStr: { $substr: ['$timestamp', 0, 10] },
          eventType: 1,
        },
      },
      {
        $group: {
          _id: '$dateStr',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])
    .toArray();
}

/**
 * MongoDB Aggregation Pipeline 4: Student-specific recent activity.
 */
export async function getStudentActivity(studentId: number, limit = 20) {
  const col = await getActivityCollection();
  return col
    .find({ studentId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
}

