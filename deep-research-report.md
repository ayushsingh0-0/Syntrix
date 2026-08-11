# Syntrix Backend Documentation (Living)

## Executive Summary  
This document serves as a **living reference** for the Syntrix backend, detailing architecture, setup, and implementation of the user registration API. It covers the tech stack (Node.js/Express, TypeScript, Prisma ORM, MySQL), key design patterns (Router–Controller–Service–Repository), and essential tools (Zod for validation, bcrypt for hashing). Diagrams illustrate the request flow and data layers. You’ll find precise instructions on environment setup, Prisma 7 configuration (including the new driver adapters and client generation), and code examples for each layer. Security best practices (password hashing, not returning credentials) and error handling (global middleware, async wrappers) are explained. Tables summarize endpoints, environment variables, and commands. A changelog template and glossary help you maintain and extend this documentation. Citations reference official Prisma, Zod, and bcrypt resources to keep advice up-to-date.

## Quick Reference  

- **Tech Stack**: Node.js (v20+), TypeScript, Express, Prisma 7, MySQL (8+).  
- **Architecture**: Layered (“Router → Controller → Service → Repository → ORM → Database”).  
- **Key Commands**: 
  - `npm install` to install deps;  
  - `npm run dev` to start server;  
  - `npx prisma migrate dev --name init` to create DB/migration;  
  - `npx prisma generate` after editing Prisma schema (see Prisma docs).  
- **Env Variables**: 
  | Name                 | Purpose                          | Example                              |
  | -------------------- | ------------------------------- | ------------------------------------ |
  | `PORT`               | Server port (default 5000)      | `5000`                               |
  | `DATABASE_URL`       | MySQL connection string        | `mysql://root:********@localhost:3306/syntrix` (password URL-encoded) |
  | `JWT_SECRET`         | Secret key for signing JWTs     | `"your_secret_key"`                  |
  | `JWT_EXPIRES_IN`     | Expiration window for JWTs      | `"7d"`                               |
  | `BCRYPT_SALT_ROUNDS` | Salt cost factor for bcrypt     | `10`                                 |
- **Endpoints** (v1 API prefix assumed):  
  | Method | Path                   | Description               | Validation Schema      |
  | ------ | ---------------------- | ------------------------- | ---------------------- |
  | `GET`  | `/api/v1/health`       | Health check              | none                   |
  | `POST` | `/api/v1/auth/register`| Register new user         | `registerSchema` (Zod) |
  | `POST` | `/api/v1/auth/login`   | Login user                | `loginSchema` (Zod)    |
  | `GET`  | `/api/v1/auth/me`      | Get current user profile  | Bearer JWT Token       |

- **Folder Layout (src/)**:
  ```
  src/
  ├── config/     # Config (env, prisma client)
  ├── controllers/ # Express controllers
  ├── routes/      # Route definitions
  ├── repositories/ # DB access layer (Prisma)
  ├── services/    # Business logic layer
  ├── validations/ # Zod schemas
  ├── middleware/  # (Error handler, etc.)
  └── server.ts    # App entry point
  ```
- **Prisma 7 Setup**:  
  - **Generator** in `schema.prisma`: change `provider="prisma-client-js"` to `"prisma-client"` and add an `output` path (e.g. `../src/generated/prisma`).  
  - **prisma.config.ts** (root) required for CLI: set `schema`, `migrations.path`, `datasource.url` using `env.DATABASE_URL`.  
  - **Adapter**: install `@prisma/adapter-mariadb` and use `PrismaMariaDb` in code to connect to MySQL (Prisma 7 uses MariaDB driver for MySQL).  
- **Database & Prisma**: Set up MySQL with a DB (e.g. `syntrix`). Ensure special chars in the password are URL-encoded (e.g. `@` → `%40`, `?` → `%3F`). Example `.env` line:  
  ```bash
  DATABASE_URL="mysql://root:MyP@ss%3Fword@localhost:3306/syntrix"
  ```  
- **Error Handling**: Implement a global error middleware (captures thrown errors, sends JSON `{ success: false, message }`). Wrap async controllers to forward errors (or use a utility like `express-async-handler`).  
- **Security**: Use `bcrypt` (or `bcryptjs`) to **hash passwords** with a salt round (e.g. `10` rounds). Never store or return raw passwords. In responses, exclude sensitive fields.  
- **Testing**: Use Postman (or similar) to send requests. Example register payload:  
  ```json
  { "name": "Alice", "email": "alice@example.com", "password": "Password123" }
  ```  
  Expect HTTP `201 Created` with user data (no password). Validate error cases (400 on invalid input, 409 if duplicate).  

<figure>  
<pre lang="mermaid">graph TD
  Client --> Route[Express Router];
  Route --> Ctrl[Auth Controller];
  Ctrl --> Val[Zod Validation];
  Val --> Serv[Auth Service];
  Serv --> Repo[User Repository];
  Repo --> ORM[Prisma Client];
  ORM --> DB[MySQL Database];
</pre>  
<figcaption>**Figure:** Layered architecture and request flow.</figcaption>  
</figure>

## Detailed Reference

### 1. Project Overview  
Syntrix is a learning project with a Node.js/TypeScript backend structured for scalability and clarity. It uses **Express** to handle HTTP requests, **Prisma 7** as the ORM for MySQL, and a layered architecture (router, controller, service, repository). Validation is done with **Zod**, and passwords are secured with **bcrypt**. The first implemented feature is the **user registration** endpoint (`POST /api/v1/auth/register`), demonstrating data flow from request to database. This doc will be kept **up-to-date** as new features are added.

### 2. Architecture (Flow & Layers)  
The request flows through these layers (see diagram above):  

- **Router**: Maps URLs to controllers. Files in `src/routes/`, e.g. `auth.routes.ts` attaches `POST /register` to `AuthController.register`.  
- **Controller**: Reads `req`, triggers validation, calls a service, and sends the `res`. *Should contain no business logic or DB calls*.  
- **Validation (Zod)**: Schemas (in `src/validations`) parse and validate `req.body` or query. If invalid, Zod throws an error (handled globally).  
- **Service**: Implements business rules. For example, `auth.service.ts` checks if a user exists, throws an error if so, hashes the password, then calls repository.  
- **Repository**: Encapsulates database operations (using Prisma). Methods like `findUserByEmail()` and `createUser()` are here. This layer knows **how** to query/insert data.  
- **Prisma Client**: Generated code provides methods to interact with the DB. We use a singleton instance imported from `src/config/prisma.ts`. Prisma 7 requires passing a *driver adapter* (here, `PrismaMariaDb` for MySQL).  
- **MySQL Database**: Stores tables. The `schema.prisma` model above creates a `User` table with fields `(id, name, email, password, createdAt, updatedAt)`.

<figure>  
<pre lang="mermaid">flowchart LR
    Router -- "GET /api/v1/health" --> HealthCtrl[Health Controller];
    Router -- "POST /api/v1/auth/register" --> AuthCtrl[Auth Controller];
    AuthCtrl -- Zod.parse(req.body) --> ValidZod[Validation];
    ValidZod --> AuthServ[Auth Service];
    AuthServ --> FindRepo[findUserByEmail()];
    AuthServ --> CreateRepo[createUser()];
    Repo --> Prisma[PrismaClient];
    Prisma --> MySQL[MySQL];
</pre>  
<figcaption>**Figure:** Request flow for register endpoint.</figcaption>  
</figure>

### 3. Folder Structure  

```
backend/
├── prisma/
│   ├── schema.prisma        # Data model (User table)
│   ├── migrations/         # Generated SQL migrations
│   └── prisma.config.ts    # Prisma v7 config (datasource, etc.)
├── src/
│   ├── config/
│   │   ├── env.ts          # Environment variable loader (Zod schema)
│   │   └── prisma.ts       # Prisma client singleton (using adapter)
│   ├── controllers/
│   │   └── auth.controller.ts  # Express handlers (e.g. register())
│   ├── routes/
│   │   └── auth.routes.ts     # Defines /auth routes
│   ├── repositories/
│   │   └── user.repository.ts # DB access methods (Prisma queries)
│   ├── services/
│   │   └── auth.service.ts    # Business logic (registerUser)
│   ├── validations/
│   │   └── auth.validation.ts # Zod schemas (registerSchema)
│   ├── middleware/
│   │   └── error.middleware.ts (unimplemented) # Global error handler
│   └── server.ts           # Express app setup and start
├── .env                   # Environment variables (not checked in)
├── tsconfig.json          # TypeScript config
└── package.json           # Project metadata and scripts
```

### 4. Setup & Configuration  

#### 4.1 Environment Variables (.env)  
Store secrets and config here. Key variables:  
- `PORT` – port for Express (default 3000).  
- `DATABASE_URL` – MySQL connection string, format:  
  ```
  mysql://USER:PASSWORD@HOST:PORT/DATABASE
  ```  
  If the password or other parts contain special characters (`@`, `?`, `#`, `%`, `&`, etc.), **URL-encode** them (e.g. `@` → `%40`, `?` → `%3F`). Example:  
  ```bash
  DATABASE_URL="mysql://root:MyP%40ssw%3Frd@localhost:3306/syntrix"
  ```  
  This avoids errors like `P1013: invalid port number`.  

In code, `src/config/env.ts` uses Zod to validate env vars on startup:

```ts
import { z } from "zod";

export const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),
});

export const env = envSchema.parse(process.env);
```

#### 4.2 Prisma 7 Configuration  

- **schema.prisma**: Define your models. Example User model:
  ```prisma
  generator client {
    provider = "prisma-client-js"
  }
  datasource db {
    provider = "mysql"
  }
  
  model User {
    id        String   @id @default(cuid())
    name      String
    email     String   @unique
    password  String
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
  }
  ```
  *Note:* For Prisma 7, change `provider = "prisma-client-js"` to `"prisma-client"` and add an `output` path so client files are generated in your source directory. For example:
  ```prisma
  generator client {
    provider = "prisma-client"
    output   = "../src/generated/prisma"
  }
  ```
  Then import PrismaClient from this generated client (`import { PrismaClient } from './generated/prisma/client'`).

- **prisma.config.ts**: Root config for Prisma CLI (v7 requires this for migrations). Example:
  ```ts
  import 'dotenv/config';
  import { defineConfig } from 'prisma/config';
  import { env } from './src/config/env';

  export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
      path: 'prisma/migrations',
    },
    datasource: {
      url: env.DATABASE_URL,
    },
  });
  ```
  This tells Prisma where to find your schema and migrations, and uses `DATABASE_URL` from env. (Prisma no longer auto-loads env vars; you can load them with `dotenv` as shown).

- **Install Dependencies**:  
  ```bash
  cd backend
  npm install @prisma/client @prisma/adapter-mariadb mariadb zod bcrypt
  npm install -D prisma typescript tsx
  ```

- **Generate Prisma Client**:  
  After editing `schema.prisma` or generator, run:  
  ```bash
  npx prisma generate
  ```  
  This outputs client code in `src/generated/prisma`. Update your imports:  
  ```ts
  // before (Prisma 6 style):
  import { PrismaClient } from '@prisma/client';
  // after (Prisma 7 style):
  import { PrismaClient } from '../generated/prisma/client';
  ```

- **Migrations**:  
  Initialize and migrate the database with:
  ```bash
  npx prisma migrate dev --name init
  ```
  This creates the `syntrix` database (if not exists) and a SQL migration file. Check for output like `migration.sql generated`, and a new folder in `prisma/migrations`.

### 5. Code Structure & Patterns  

#### 5.1 Prisma Client (Singleton)  
Create **one** PrismaClient for the app. In `src/config/prisma.ts`:

```ts
import { PrismaClient } from '@prisma/client';  // or generated client path if changed
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { env } from './env';

const adapter = new PrismaMariaDb({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'MyP%40ssw%3Frd', // use unencoded string here; adapter handles raw values
  database: 'syntrix',
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

export default prisma;
```

This uses the MariaDB adapter to connect to MySQL. The adapter is configured with connection details (host, port, user, password, database). Now *all* queries in the app use this single `prisma` instance.

#### 5.2 Repository Layer  
In `src/repositories/user.repository.ts`, interact with the `User` table via Prisma:

```ts
import prisma from "../config/prisma";

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};

export const createUser = async (
  name: string,
  email: string,
  password: string
) => {
  return prisma.user.create({
    data: { name, email, password },
  });
};
```

The repository **only** contains data-access logic (no request or business rules).

#### 5.3 Service Layer  
In `src/services/auth.service.ts`, implement business rules:

```ts
import { findUserByEmail, createUser } from "../repositories/user.repository";
import { hashPassword } from "../utils/password";

export const registerUser = async (
  name: string,
  email: string,
  password: string
) => {
  // Check uniqueness
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error("User already exists");
  }

  // Hash password
  const hashed = await hashPassword(password);
  // Save user
  const user = await createUser(name, email, hashed);
  // Return only non-sensitive fields (strip out password)
  const { password: _, ...userData } = user;
  return userData;
};
```

Here, the service enforces **no duplicate emails** and hashes the password (bcrypt is slow and adaptive, protecting against brute-force). It returns a sanitized user object (excluding the hashed password).

#### 5.4 Controller & Routes  
##### Auth Controller (`src/controllers/auth.controller.ts`):

```ts
import { Request, Response, NextFunction } from "express";
import { registerSchema } from "../validations/auth.validation";
import { registerUser } from "../services/auth.service";

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input (throws if invalid)
    const data = registerSchema.parse(req.body);

    // Perform registration logic
    const user = await registerUser(data.name, data.email, data.password);

    // Respond with created user (sans password)
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err); // Forward to error handler
  }
};
```

The controller parses and validates input using Zod, calls the service, and sends JSON response. It never talks to the repository or database directly.

##### Auth Routes (`src/routes/auth.routes.ts`):

```ts
import { Router } from "express";
import { register } from "../controllers/auth.controller";

const router = Router();
router.post("/register", register);
export default router;
```

Mount this in the main router (e.g. in `src/routes/index.ts` or directly in `server.ts`):

```ts
import authRoutes from "./routes/auth.routes";
// ...
app.use("/api/v1/auth", authRoutes);
```

Now `POST /api/v1/auth/register` is handled by `register`.

#### 5.5 Validation (Zod Schemas)  
In `src/validations/auth.validation.ts`, define request schemas:

```ts
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
```

When `registerSchema.parse(req.body)` is called, Zod checks types and rules. If validation fails, Zod throws, which we catch in the controller to return a 400 error. Zod is TypeScript-first and infers types, so you get both validation and type safety.

### 6. API Endpoints  

| Method | URL                       | Description                  | Body / Params             | Response (201)                     |
| ------ | ------------------------- | --------------------------- | ------------------------- | ----------------------------------- |
| **GET**  | `/api/v1/health`         | Health check (optional)      | –                         | `{ success: true, status: 'ok' }`  |
| **POST** | `/api/v1/auth/register`  | Register new user            | JSON `{ name, email, password }` (validated by `registerSchema`) | `{ success: true, data: { id, name, email, createdAt } }` |
| **POST** | `/api/v1/auth/login`     | User login                   | JSON `{ email, password }` (validated by `loginSchema`) | `{ success: true, data: { token, user } }` |
| **GET**  | `/api/v1/auth/me`        | Get current user profile     | Header: `Authorization: Bearer <token>` | `{ success: true, data: { id, email } }` |

**Request Example (register)**:
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "Password123"
}
```

**Success Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "id": "ckxyz...abc",
    "name": "Alice",
    "email": "alice@example.com",
    "createdAt": "2026-07-30T12:34:56.789Z"
  }
}
```
*(Note: `password` is omitted from the response for security.)*

### 7. Security Best Practices  

- **Password Hashing**: Use `bcrypt` (or `bcryptjs`) to hash passwords before storing. For example:
  ```ts
  import { hashPassword } from '../utils/password';
  const hashed = await hashPassword(password);
  ```
  (10 salt rounds is a common default; increase for more security if performance allows.) The resulting hash (e.g. `$2b$10$...`) goes into the DB, not the plaintext password. *Never* store raw passwords.

- **No Credentials in Responses**: As a rule, **do not return** any credential fields (password hashes, tokens) in API responses. Strip them out before sending. For instance, in the service above we did:
  ```ts
  const { password: _, ...userData } = user;
  return userData;
  ```
- **Use HTTPS in Production**: Always use TLS/SSL in production to encrypt traffic.

- **Environment Secrets**: Keep `.env` out of version control. Use CI/CD secrets or environment management for deployment. Never hardcode secrets in code.

- **Validate Everything**: Use Zod or similar to validate all inputs. Never trust client data.

- **Error Messages**: Don’t leak sensitive info in error responses (e.g. “database error” is fine; “password is wrong” is fine; avoid “stack trace” in production).

### 8. Error Handling  

Implement a **global error handler** middleware in Express to format errors. Example (in `middleware/error.middleware.ts`):

```ts
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err); // for debugging

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err.name === 'ZodError') {
    // Validation error from Zod
    return res.status(400).json({ success: false, errors: err.errors });
  }

  // Custom thrown generic errors
  if (err.message) {
    return res.status(400).json({ success: false, message: err.message });
  }

  // Fallback
  res.status(500).json({ success: false, message: 'Internal Server Error' });
}
```

Use it in `server.ts` after all routes:

```ts
app.use(errorHandler);
```

Also use an **async wrapper** (or `try/catch`) in controllers to catch rejected promises and `next(err)` into the handler. This avoids unhandled promise rejections. Example utility:

```ts
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

Then controllers can be written as:
```ts
router.post("/register", asyncHandler(register));
```

### 9. Testing Tips  

- **Postman / Insomnia / Curl**: Test endpoints manually. Check both success and error cases.  
- **Sample Requests**: For register, use valid and invalid payloads to exercise Zod (e.g. short password, malformed email).  
- **Health Endpoint**: (Optional) A simple `/health` route returning `{ status: "ok" }` with 200 helps ensure the app is running.  
- **Prisma Studio**: Use `npx prisma studio` to visually inspect the database. (Note: Prisma Studio for MySQL now supports GUI.)  
- **Unit Tests** (future): Use a testing framework (Jest, Vitest) and possibly an in-memory SQLite or test MySQL instance to write automated tests for services/controllers.

### 10. Common Troubleshooting  

| Error / Issue            | Likely Cause & Solution                                                 |
|--------------------------|-------------------------------------------------------------------------|
| **P1000 (Authentication failed)** | Wrong DB credentials. Check `DATABASE_URL` username/password. Try logging in manually with `mysql -u root -p`. |
| **P1013 (Invalid DB string)** | Malformed `DATABASE_URL`. Ensure format `mysql://user:pass@host:port/db`. Special chars in password must be percent-encoded (e.g. `?`→`%3F`, `@`→`%40`). |
| **PrismaClientInitError** | Using `new PrismaClient()` without adapter in Prisma 7. Update config as above (pass adapter). Also ensure using the generated client import if changed provider. |
| **Adapter not found**     | Did you `npm install @prisma/adapter-mariadb mariadb`? (There’s no `adapter-mysql` package.) |
| **Prisma CLI errors**    | Make sure `prisma.config.ts` is present (Prisma 7 requires it) and environment variables are loaded (`dotenv/config`). |
| **Schema/Generate mismatches** | If you changed `schema.prisma`, rerun `npx prisma migrate dev` and `npx prisma generate`. For Prisma 7, schema and client must stay in sync. |
| **Port 3306 in use**     | Another MySQL instance or service using that port. Change MySQL port or stop other service. |

### 11. Commands & Migration  

- **Install dependencies**:  
  ```bash
  npm install
  ```

- **Generate Prisma client** (after schema changes):  
  ```bash
  npx prisma generate
  ```

- **Migrate Database**:  
  ```bash
  npx prisma migrate dev --name init
  ```  
  This reads `schema.prisma`, creates a new database (if needed), and writes migration SQL to `prisma/migrations`.

- **Run App (Dev)**:  
  ```bash
  npm run dev   # uses tsx or nodemon to watch ts files
  ```
  or  
  ```bash
  npx tsx watch src/server.ts
  ```

- **Build & Start (Prod)**:  
  Configure `"build"` (e.g. `tsc`) and `"start"` scripts in `package.json`. Ensure `.env` is provided in production.

### 12. Changelog & Updates  

Maintain a **Changelog** at the project root (e.g. `CHANGELOG.md`) or in docs. Use [Keep a Changelog](https://keepachangelog.com/) format. Example template:

| Date       | Version | Description                     | Author  |
|------------|---------|---------------------------------|---------|
| 2026-07-30 | 1.0.0   | Initial backend scaffold: Express server, Prisma 7 setup, Auth register implemented | Ayush |
| 2026-07-30 | 1.1.0   | Added global error handler, password hashing, migrated Prisma to provider=prisma-client (in migration) | Ayush |
| 2026-07-30 | 1.2.0   | Updated API routing prefix to /api/v1 in app.ts; Refactored password logic into reusable utility | Antigravity |
| 2026-07-30 | 1.3.0   | Implemented Auth Login feature with Zod validation and secure bcrypt password comparison | Ayush / Antigravity |
| 2026-07-30 | 1.4.0   | Implemented JWT authentication utility, login token issuance, auth middleware, and protected /me endpoint | Ayush / Antigravity |
| 2026-08-04 | 1.5.0   | Moved BCRYPT_SALT_ROUNDS and JWT configs to .env and envSchema validation | Ayush / Antigravity |
| 2026-08-04 | 1.6.0   | Implemented custom ApiError class and integrated it into global error handler | Ayush / Antigravity |

**Update Process:** Whenever you add a feature or make a breaking change:
1. Increment version in docs.  
2. Summarize changes in the table above (date, version, summary).  
3. Update relevant sections of this doc to match code changes.  
4. Ensure documentation examples (code snippets, endpoint docs) are revised.  

### 13. Glossary  

- **ORM**: *Object-Relational Mapping*, a library (Prisma) that maps database tables to objects.  
- **Prisma 7**: Latest major Prisma ORM; uses driver adapters (e.g. MariaDB for MySQL).  
- **Prisma Client**: Auto-generated TypeScript client from your schema. Used for DB queries.  
- **Adapter**: A driver interface for Prisma 7 (e.g. `PrismaMariaDb`) that handles DB connections.  
- **Zod**: A TypeScript-first schema validation library.  
- **bcrypt**: A password-hashing algorithm/library. Slow and salted by design, making brute-force attacks harder.  
- **Validation Schema**: Zod-defined shape and rules for input (e.g. `registerSchema`).  
- **Singleton**: A single shared instance (e.g. one `PrismaClient` for the whole app).  
- **Middleware**: Express function that can inspect/modify requests/responses (e.g. error handler).  
- **DTO**: Data Transfer Object, an object defining what fields to return in an API response (used to exclude passwords).  

---

*This documentation will evolve with the Syntrix project. Refer to official docs as needed: Prisma’s guides on MySQL/Prisma 7, Zod’s API, and bcrypt best practices.*