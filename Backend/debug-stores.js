require('dotenv').config();
const db = require('./config/database');

    const [rows] = await db.query("SELECT user_id, email FROM users LIMIT 1");
    console.log("User:", rows);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listStores();
