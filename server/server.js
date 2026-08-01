import app from './app.js';

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📦 Database: MongoDB`);
  console.log(`🔐 Auth: JWT (${process.env.JWT_EXPIRES_IN || '8h'} expiry)`);
});
