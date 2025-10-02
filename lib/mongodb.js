import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Por favor, defina a variável MONGODB_URI no arquivo .env.local');
}

/**
 * Global é usado aqui para manter uma conexão cached através de hot reloads
 * no desenvolvimento. Isso previne conexões de se acumularem durante a API
 * de desenvolvimento do Next.js que pode rapidamente esgotar os limites de conexão do banco.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    // Modificar a URI para usar a base de dados "Empates"
    const empatesURI = MONGODB_URI.replace(/\/[^/?]+(\?|$)/, '/Empates$1');
    
    cached.promise = mongoose.connect(empatesURI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;