import pool from '../utils/pool.js';
import jwt from 'jsonwebtoken';

export default class User {
  id;
  username;
  email;
  passwordHash;

  constructor(row) {
    this.id = row.id;
    this.username = row.username;
    this.email = row.email;
    this.passwordHash = row.password_hash;
  }

  static async insert(email, passwordHash) {
    const { rows } = await pool.query(
      `
        INSERT INTO users (email, password_hash)
        VALUES ($1, $2)
        RETURNING *
      `,
      [email, passwordHash]
    );
    return new User(rows[0]);
  }

  static async insertByUsername(username) {
    const { rows } = await pool.query(
      `
        INSERT INTO users (username)
        VALUES ($1)
        RETURNING *
      `,
      [username]
    );
    return new User(rows[0]);
  }

  static async findByUsername(username) {
    const { rows } = await pool.query('SELECT * FROM users WHERE username=$1', [
      username,
    ]);

    if (!rows[0]) return null;
    return new User(rows[0]);
  }

  static async findByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [
      email,
    ]);
    if (!rows[0]) return null;
    return new User(rows[0]);
  }

  authToken() {
    return jwt.sign(this.toJSON(), process.env.API_SECRET, {
      expiresIn: '24h',
    });
  }

  toJSON() {
    return { id: this.id, username: this.username, email: this.email };
  }
}
