import bcryptjs from 'bcryptjs';
import postgres from 'postgres';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function createUuidExtension() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
}

async function seedUsers() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `;

  for (const user of users) {
    const hashedPassword = await bcryptjs.hash(user.password, 10);
    await sql`
      INSERT INTO users (name, email, password)
      VALUES (${user.name}, ${user.email}, ${hashedPassword})
      ON CONFLICT (email) DO NOTHING
    `;
  }
}

async function seedCustomers() {
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      image_url TEXT
    )
  `;

  for (const customer of customers) {
    await sql`
      INSERT INTO customers (name, email, image_url)
      VALUES (${customer.name}, ${customer.email}, ${customer.image_url})
      ON CONFLICT (email) DO NOTHING
    `;
  }
}

async function seedInvoices() {
  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL,
      date DATE NOT NULL
    )
  `;

  for (const invoice of invoices) {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
    `;
  }
}

async function seedRevenue() {
  await sql`
    CREATE TABLE IF NOT EXISTS revenue (
      month TEXT NOT NULL UNIQUE,
      revenue INTEGER NOT NULL
    )
  `;

  for (const entry of revenue) {
    await sql`
      INSERT INTO revenue (month, revenue)
      VALUES (${entry.month}, ${entry.revenue})
      ON CONFLICT (month) DO NOTHING
    `;
  }
}

// ✅ The GET handler
export async function GET() {
  try {
    await createUuidExtension();
    await seedUsers();
    await seedCustomers();
    await seedInvoices();
    await seedRevenue();

    return new Response(JSON.stringify({ message: '✅ Seeding completed successfully.' }), {
      status: 200,
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return new Response(JSON.stringify({ message: '❌ Seeding failed.', error }), {
      status: 500,
    });
  }
}
