// Gives (or takes back) the platform admin role.
//   pnpm admin:grant someone@example.com
//   pnpm admin:revoke someone@example.com   (back to photographer)
// There is no way to become admin from the app itself: only someone with
// access to the server and its database can run this.

import pg from "pg";

const [action, email] = process.argv.slice(2);
if (!["grant", "revoke"].includes(action) || !email) {
	console.error("Usage: pnpm admin:grant <email>  |  pnpm admin:revoke <email>");
	process.exit(1);
}

process.loadEnvFile(".env");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
	const role = action === "grant" ? "admin" : "photographer";
	const { rows } = await client.query(
		"update users set role = $1, updated_at = now() where lower(email) = lower($2) returning name, email, role",
		[role, email.trim()],
	);
	if (rows.length === 0) {
		console.error(`No account with the email ${email}. Sign up first, then run this again.`);
		process.exitCode = 1;
	} else {
		console.log(`${rows[0].name} <${rows[0].email}> is now: ${rows[0].role}`);
	}
} finally {
	await client.end();
}
