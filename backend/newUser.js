import bcrypt from 'bcryptjs';
import { executeQuery } from './utils/db.js'; // Adjust if path differs

// CONFIGURE THESE VALUES
const email = 'kwasi@visionkraftconsulting.com';
const plainPassword = '!@P@ssys6461#';
const name = 'Kwasi Kabiro';

async function createUser() {
  if (!email || !plainPassword) {
    console.error('❌ Email and password are required');
    process.exit(1);
  }

  try {
    console.log(`[🔐] Hashing password for ${email}...`);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const existing = await executeQuery('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.warn('⚠️ User already exists with this email.');
      return;
    }

    await executeQuery(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name || null, 'Super Admin']
    );

    console.log(`✅ User ${email} inserted successfully.`);
  } catch (err) {
    console.error('❌ Error inserting user:', err.message);
  }
}

createUser();