import { executeQuery } from '../utils/db.js';

/**
 * Save the Plaid access token for a user in the database.
 * @param {number|string} userId
 * @param {string} accessToken
 */
export async function saveAccessToken(userId, accessToken) {
  const sql = `
    INSERT INTO user_plaid_tokens (user_id, access_token)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE access_token = VALUES(access_token), updated_at = CURRENT_TIMESTAMP
  `;
  await executeQuery(sql, [userId, accessToken]);
}

/**
 * Retrieve the Plaid access token for a given user from the database.
 * @param {number|string} userId
 * @returns {Promise<string>}
 * @throws if no token is found
 */
export async function getAccessToken(userId) {
  const rows = await executeQuery(
    'SELECT access_token FROM user_plaid_tokens WHERE user_id = ?',
    [userId]
  );
  if (rows.length > 0 && rows[0].access_token) {
    return rows[0].access_token;
  }
  throw new Error('No Plaid access token found for user');
}