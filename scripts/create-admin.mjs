// Creates the platform administrator, or resets their password.
//   pnpm admin:create                       (uses ADMIN_EMAIL from .env)
//   pnpm admin:create someone@example.com "Their Name"
// The password is typed in the terminal (hidden) and never stored in a file.
// An account that exists already becomes admin, verified, with the new
// password, and is signed out everywhere. There is no way to do this from the
// app: only someone with access to the server and its database can.

import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline";
import { hashPassword } from "better-auth/crypto";
import pg from "pg";

const MIN_PASSWORD = 8;
const MAX_PASSWORD = 128;

process.loadEnvFile(".env");
const email = (process.argv[2] ?? process.env.ADMIN_EMAIL ?? "")
	.trim()
	.toLowerCase();
const name = process.argv[3]?.trim() || "AuraDesk Admin";
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
	console.error(
		'Usage: pnpm admin:create [email] ["Name"]   (email defaults to ADMIN_EMAIL in .env)',
	);
	process.exit(1);
}

/** Reads a line without echoing it; piped input (no terminal) is read as is. */
function createPrompter() {
	if (!process.stdin.isTTY) {
		const lines = createInterface({ input: process.stdin })[
			Symbol.asyncIterator
		]();
		return async () => (await lines.next()).value ?? "";
	}
	return (question) =>
		new Promise((resolve) => {
			process.stdout.write(question);
			const stdin = process.stdin;
			stdin.setRawMode(true);
			stdin.resume();
			stdin.setEncoding("utf8");
			let value = "";
			const onData = (chunk) => {
				for (const char of chunk) {
					if (char === "\r" || char === "\n" || char === "\u0004") {
						stdin.setRawMode(false);
						stdin.pause();
						stdin.off("data", onData);
						process.stdout.write("\n");
						return resolve(value);
					}
					if (char === "\u0003") process.exit(130);
					value =
						char === "\u007f" || char === "\b" ? value.slice(0, -1) : value + char;
				}
			};
			stdin.on("data", onData);
		});
}

const ask = createPrompter();
console.log(`Administrator account for ${email}`);
const password = await ask("New password: ");
if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) {
	console.error(
		`The password must be ${MIN_PASSWORD} to ${MAX_PASSWORD} characters long.`,
	);
	process.exit(1);
}
if ((await ask("Repeat the password: ")) !== password) {
	console.error("The two passwords don't match. Nothing was changed.");
	process.exit(1);
}

const newId = () => randomBytes(16).toString("hex");
const hash = await hashPassword(password);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
	await client.query("begin");
	const found = await client.query(
		"select id, name from users where lower(email) = $1",
		[email],
	);
	let user = found.rows[0];
	if (user) {
		await client.query(
			"update users set role = 'admin', email_verified = true, banned = false, ban_reason = null, ban_expires = null, updated_at = now() where id = $1",
			[user.id],
		);
	} else {
		user = { id: newId(), name };
		await client.query(
			"insert into users (id, name, email, email_verified, role, created_at, updated_at) values ($1, $2, $3, true, 'admin', now(), now())",
			[user.id, name, email],
		);
	}

	const credential = await client.query(
		"update accounts set password = $1, updated_at = now() where user_id = $2 and provider_id = 'credential' returning id",
		[hash, user.id],
	);
	if (credential.rowCount === 0) {
		await client.query(
			"insert into accounts (id, user_id, account_id, provider_id, password, created_at, updated_at) values ($1, $2, $3, 'credential', $4, now(), now())",
			[newId(), user.id, user.id, hash],
		);
	}
	// A new password ends every session opened with the old one.
	await client.query("delete from sessions where user_id = $1", [user.id]);

	await client.query(
		`insert into admin_audit_logs (id, actor_name, action, target_id, target_name, target_email)
		 values ($1, 'Command line', 'GRANT_ADMIN', $2, $3, $4)`,
		[`cli${Date.now().toString(36)}${newId().slice(0, 8)}`, user.id, user.name, email],
	);
	await client.query("commit");
	console.log(
		`${found.rows[0] ? "Updated" : "Created"}: ${user.name} <${email}> is an administrator.`,
	);
	console.log("Sign in at /admin/login.");
} catch (error) {
	await client.query("rollback");
	throw error;
} finally {
	await client.end();
}
