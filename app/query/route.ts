import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function listInvoices() {
  const data = await sql`
    SELECT invoices.amount, customers.name
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE invoices.amount = 666;
  `;

  return data;
}

async function dropAllTables() {
  try {
    // Begin a transaction to ensure all drops happen atomically
    await sql.begin(async (sql) => {
      // Drop tables with CASCADE to remove any foreign key constraints
      await sql`DROP TABLE IF EXISTS invoices CASCADE;`;
      await sql`DROP TABLE IF EXISTS customers CASCADE;`;
      await sql`DROP TABLE IF EXISTS revenue CASCADE;`;
      await sql`DROP TABLE IF EXISTS users CASCADE;`;
      // Drop the uuid-ossp extension if it exists
      await sql`DROP EXTENSION IF EXISTS "uuid-ossp";`;
    });
    console.log("All tables and extensions dropped successfully");
    return { success: true };
  } catch (error) {
    console.error("Error dropping tables:", error);
    throw error;
  }
}

export async function GET() {
  try {
    return Response.json(await listInvoices());
    // await dropAllTables();
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
