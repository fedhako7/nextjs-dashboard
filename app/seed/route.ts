import bcryptjs from 'bcryptjs';
import postgres from 'postgres';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function seedUsers() {
  console.log('Starting seedUsers...');
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  console.log('UUID extension created or skipped');
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;
  console.log('Users table created or skipped');

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      console.log(`Hashing password for user ${user.email}`);
      const hashedPassword = await bcryptjs.hash(user.password, 10);
      console.log(`Inserting user ${user.email}`);
      return sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );
  console.log('Finished seedUsers');
  return insertedUsers;
}

async function seedInvoices() {
  console.log('Starting seedInvoices...');
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  console.log('UUID extension created or skipped');
  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;
  console.log('Invoices table created or skipped');

  const insertedInvoices = await Promise.all(
    invoices.map((invoice) => {
      console.log(`Inserting invoice for customer ${invoice.customer_id}`);
      return sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );
  console.log('Finished seedInvoices');
  return insertedInvoices;
}

async function seedCustomers() {
  console.log('Starting seedCustomers...');
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  console.log('UUID extension created or skipped');
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;
  console.log('Customers table created or skipped');

  const insertedCustomers = await Promise.all(
    customers.map((customer) => {
      console.log(`Inserting customer ${customer.email}`);
      return sql`
        INSERT INTO customers (id, name, email, image_url)
        VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );
  console.log('Finished seedCustomers');
  return insertedCustomers;
}

async function seedRevenue() {
  console.log('Starting seedRevenue...');
  await sql`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;
  console.log('Revenue table created or skipped');

  const insertedRevenue = await Promise.all(
    revenue.map((rev) => {
      console.log(`Inserting revenue for month ${rev.month}`);
      return sql`
        INSERT INTO revenue (month, revenue)
        VALUES (${rev.month}, ${rev.revenue})
        ON CONFLICT (month) DO NOTHING;
      `;
    }),
  );
  console.log('Finished seedRevenue');
  return insertedRevenue;
}

export async function GET() {
  console.log('Starting GET /seed request...');
  const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
  try {
    await sql.begin(async (sql) => {
      console.log('Beginning transaction...');
      await seedUsers();
      await seedCustomers();
      await seedInvoices();
      await seedRevenue();
      console.log('Transaction completed');
    });
    console.log('Sending success response');
    return new Response(JSON.stringify({ message: 'Database seeded successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return new Response(JSON.stringify({ error: 'Failed to seed database' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    console.log('Closing connection');
    await sql.end(); // Safe here because it’s a per-request connection
  }
}
