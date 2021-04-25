import { MongoClient, Db, MongoClientOptions } from 'mongodb'

if (!process.env.MONGODB_USER || !process.env.MONGODB_PASS) {
  console.error('MongoDB credentials should be given in .env.production.local file. Quitting.')
  process.exit()
}

const uri: string = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@main.hfono.mongodb.net/${process.env.MONGODB_DB}?retryWrites=true&w=majority`
const options: MongoClientOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 3000,
  connectTimeoutMS: 3000,
}

export const connect = async () => {
  console.log(`Will connect to ${uri}`)
  let client: MongoClient | null = null
  try {
    client = await MongoClient.connect(uri, options)
  }
  catch (err) {
    console.error(`MongoDB error when connecting: ${err}`)
  }
  return client
}

export const query = async (db: Db | undefined, coll: string, filter: object) => {
  if (!db) {
    return { statusCode: 500, body: 'No DB handler to query from.' }
  }

  console.log(`Will query from ${db.databaseName}.${coll}`, filter)
  try {
    const docs = await db.collection(coll).find(filter).toArray()
    return { statusCode: 200, body: docs }
  } catch (err) {
    console.error(`An error occurred while reading from DB: ${err}`)
    return { statusCode: 500, body: err }
  }
}

export const write = async (db: Db | undefined, coll: string, doc: object) => {
  if (!db) {
    return { statusCode: 500, body: 'No DB handler to write to.' }
  }

  console.log(`Will write to ${db.databaseName}.${coll}`, doc)
  try {
    await db.collection(coll).insertOne(doc)
    return { statusCode: 200, body: 'success' }
  } catch (err) {
    console.error(`An error occurred while writing to DB: ${err}`)
    return { statusCode: 500, body: err }
  }
}
