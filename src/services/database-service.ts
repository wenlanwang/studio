
import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';

class DatabaseService {
  private db: Database | null = null;
  private initializing: Promise<void> | null = null;

  constructor() {
    this.initializing = this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.db = await open({
        filename: 'D:\database\mydb.db',
        driver: sqlite3.Database,
      });
      await this.seed();
    } catch (error) {
      console.error('Failed to initialize the database:', error);
      this.initializing = null; // Reset for potential retry
      throw error;
    }
  }

  private async seed(): Promise<void> {
    if (!this.db) return;
    console.log('Seeding database...');
    // Create tables
    await this.db.exec(`
      CREATE TABLE customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        signup_date DATE NOT NULL
      );
      CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL
      );
      CREATE TABLE sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        sale_date DATE NOT NULL,
        amount REAL NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers (id)
      );
      CREATE TABLE sales_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER,
        product_id INTEGER,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      );
    `);

    // Seed data
    await this.db.run("INSERT INTO customers (name, signup_date) VALUES ('John Doe', '2024-06-15'), ('Jane Smith', '2024-07-01')");
    await this.db.run("INSERT INTO products (name, price) VALUES ('Flux Capacitor', 1299.99), ('Time-Turner', 89.50), ('Hoverboard', 550.00)");
    await this.db.run("INSERT INTO sales (customer_id, sale_date, amount) VALUES (1, '2024-07-05', 1849.99), (2, '2024-07-12', 550.00)");
    await this.db.run("INSERT INTO sales_items (sale_id, product_id, quantity) VALUES (1, 1, 1), (1, 3, 1), (2, 3, 1)");

    console.log('Database seeded successfully.');
  }

  public async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (this.initializing) {
      await this.initializing;
    }
    if (!this.db) {
      throw new Error('Database is not initialized.');
    }
    try {
      const result = await this.db.all<T[]>(sql, params);
      return result;
    } catch (error) {
        console.error("Failed to execute query:", sql, params);
        console.error(error);
        throw error;
    }
  }
}

// Export a singleton instance
export const dbService = new DatabaseService();
