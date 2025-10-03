import connectToDatabase from '../../../lib/mongodb.js';
import mongoose from 'mongoose';

export async function GET() {
  await connectToDatabase();
  // Nome da coleção histórica (ajusta se necessário)
  const collectionName = 'laliga_2024_25';
  const collection = mongoose.connection.collection(collectionName);
  const teams = await collection.find({}, { projection: { teamName: 1, _id: 0 } }).toArray();
  return Response.json({
    collection: collectionName,
    totalTeams: teams.length,
    teamNames: teams.map(t => t.teamName)
  });
}
