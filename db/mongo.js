const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("❌ MONGO_URI não definida no .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      dbName: "vigiai",
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log("✅ Conectado ao MongoDB");
  } catch (err) {
    console.error("❌ Erro ao conectar ao MongoDB:", err.message);
    process.exit(1);
  }
}

module.exports = { connectDB };
