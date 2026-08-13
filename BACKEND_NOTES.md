# Syntrix Backend Architecture & Engineering Master Notes

---

## 1. Architectural Philosophy: The Layered Architecture (Beyond Traditional MVC)

### 1.1 What is MVC and Why Did We Go Further?
In traditional **MVC (Model-View-Controller)**:
* **Model**: Database queries and schema definitions.
* **View**: UI templates (HTML/EJS) or JSON responses.
* **Controller**: Everything else — input validation, database fetching, password hashing, token generation, business decisions, and HTTP status codes.

**The Problem with traditional MVC**: In real-world enterprise apps, Controllers become "Fat Controllers" (hundreds of lines of mixed database queries, business rules, and HTTP logic). If you want to change your database, test business logic, or switch frameworks, everything is tangled together.

### 1.2 Our Solution: 6-Tier Layered Architecture
We separate every distinct responsibility into its own isolated layer (**Single Responsibility Principle**):

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ 1. HTTP REQUEST ARRIVES (e.g. POST /api/v1/auth/register)                      │
└──────────────────────────────────────┬─────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│ 2. MIDDLEWARE LAYER (src/middleware/ & app.ts)                                 │
│    • helmet() -> Sets HTTP security headers                                    │
│    • cors() -> Controls cross-origin requests                                  │
│    • express.json() -> Parses JSON body into req.body                          │
│    • morgan('dev') -> Logs request method, URL, status code, & time in console │
│    • authenticate -> (Protected routes only) Verifies JWT token                │
└──────────────────────────────────────┬─────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│ 3. ROUTER LAYER (src/routes/)                                                  │
│    • Dispatches HTTP methods (GET, POST, etc.) and paths to Controllers        │
└──────────────────────────────────────┬─────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│ 4. CONTROLLER LAYER (src/controllers/)                                         │
│    • ONLY handles HTTP concerns:                                               │
│      1. Reads req.body / req.params / req.headers                              │
│      2. Validates input schema using Zod                                       │
│      3. Calls the Service layer function                                       │
│      4. Returns res.status(200/201).json(...)                                  │
│    • NEVER contains database queries or direct password hashing               │
└──────────────────────────────────────┬─────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│ 5. SERVICE LAYER (src/services/)                                               │
│    • Pure Business Logic:                                                      │
│      1. Checks domain rules (e.g. "Does email already exist?")                 │
│      2. Calls encryption/JWT utilities (e.g. hashPassword, generateToken)      │
│      3. Calls Repository functions to read/write data                          │
│      4. Strips out sensitive fields (like password hashes)                     │
│    • Completely decoupled from HTTP (No `req` or `res` objects allowed here!)  │
└──────────────────────────────────────┬─────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│ 6. REPOSITORY LAYER (src/repositories/)                                        │
│    • Pure Data Access:                                                         │
│      1. Executes Prisma queries (findUnique, create, update, delete)           │
│      2. Contains zero business logic and zero HTTP awareness                   │
└──────────────────────────────────────┬─────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│ 7. ORM & DATABASE ENGINE (Prisma 7 + MariaDB / MySQL)                          │
│    • Translates Prisma calls into optimized SQL queries                        │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Complete Breakdown of Installed Packages

### 2.1 Production Dependencies (`dependencies`)

| Package | What It Is | What It Does & Why We Installed It |
| :--- | :--- | :--- |
| **`express`** | Web Framework | Provides HTTP server primitives, request routing (`app.get`, `app.post`), middleware chaining (`next()`), and JSON request/response handling. |
| **`dotenv`** | Environment Loader | Reads key-value pairs from the `.env` file and injects them into Node's `process.env`. |
| **`zod`** | Schema Validation | Validates data shapes at runtime with automatic TypeScript static type inference. Used for validating `.env` variables and client request bodies. |
| **`bcrypt`** | Password Hashing | Implements adaptive cryptographic hashing using the Blowfish cipher. Uses salt rounds to defend against rainbow tables and brute-force attacks. |
| **`jsonwebtoken`** | JWT Implementation | Signs and cryptographically verifies JSON Web Tokens for stateless user authentication. |
| **`@prisma/client`** | Type-safe ORM Client | Auto-generated database client based on `schema.prisma`. Gives autocomplete and compile-time type safety for every SQL query. |
| **`@prisma/adapter-mariadb`** | Prisma 7 Driver Adapter | Connects Prisma 7 directly to the MariaDB native driver for maximum query performance and connection management. |
| **`mariadb`** | MySQL/MariaDB Driver | The underlying native Node.js driver used by `@prisma/adapter-mariadb` to communicate with the database engine over TCP/IP. |
| **`cors`** | CORS Middleware | Adds `Access-Control-Allow-Origin` headers so frontend apps (React, Next.js, mobile apps) on other domains can communicate with our API. |
| **`helmet`** | HTTP Security Headers | Automatically sets secure HTTP headers (`X-Content-Type-Options`, `Strict-Transport-Security`, `X-Frame-Options`) to protect against common web vulnerabilities. |
| **`morgan`** | Request Logger | Logs every incoming HTTP request to the terminal (e.g. `POST /api/v1/auth/login 200 45ms`) for real-time visibility during development. |

### 2.2 Development Dependencies (`devDependencies`)

| Package | What It Is | What It Does & Why We Installed It |
| :--- | :--- | :--- |
| **`typescript`** | TypeScript Compiler | Adds static type checking to JavaScript, catching bugs before code runs. |
| **`tsx`** | TypeScript Execution Engine | Runs TypeScript files instantly without needing manual compilation steps (`tsc`), with built-in hot-reloading file watch mode (`tsx watch`). |
| **`prisma`** | Prisma CLI | Command-line tool to run migrations (`prisma migrate dev`), generate clients (`prisma generate`), and manage schema changes. |
| **`@types/*`** (`node`, `express`, `cors`, `morgan`, `bcrypt`, `jsonwebtoken`) | Type Definitions | Provides TypeScript definitions for libraries that were originally written in pure JavaScript. |

---

## 3. Step-by-Step Codebase Walkthrough

---

### Step 1: TypeScript Configuration (`tsconfig.json`)

* **What it is**: The master compiler configuration file for TypeScript.
* **What it does**: Tells TypeScript how strictly to check types and how to resolve imports.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["node"]
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

#### Key Concepts Explained:
* `"target": "ES2022"`: Compiles to modern ECMAScript features (async/await, private class fields).
* `"module": "NodeNext"` & `"moduleResolution": "NodeNext"`: Modern Node.js module resolution supporting both ES Modules (`import/export`) and CommonJS seamlessly.
* `"strict": true`: Enables all strict type-checking options (disallows implicit `any`, checks `null` and `undefined` strictly).
* `"outDir": "./dist"`: Compiles production `.js` output files into the `dist/` directory.

---

### Step 2: Fail-Fast Environment Validation (`.env` & `src/config/env.ts`)

* **What it is**: Centralized configuration management following the 12-Factor App methodology.
* **Why it exists**: Hardcoding configs or secrets in code is dangerous and inflexible across environments (Dev, Test, Prod). If someone forgets a variable in `.env`, the app should crash immediately with a clear message instead of failing unexpectedly during a user request.

#### `.env`
```env
PORT=5000
DATABASE_URL="mysql://root:Shayush123%3F@localhost:3306/syntrix"

# JWT Configuration
JWT_SECRET="u7X$9p!Qz@3Lr^1wF*eGk#8hVdYtZsN0mB"
JWT_EXPIRES_IN="7d"

# Bcrypt Configuration
BCRYPT_SALT_ROUNDS=10
```

#### `src/config/env.ts`
```typescript
import { config } from 'dotenv';
import { z } from 'zod';

config(); // Loads .env into process.env

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1); // Stop server immediately
}

export const env = parsed.data;
```

#### Key Concepts Explained:
* `z.coerce.number()`: `process.env.PORT` is always a string `"5000"`. `z.coerce.number()` automatically transforms it into the JavaScript number `5000`.
* `envSchema.safeParse(process.env)`: Parses and validates all variables without throwing an unhandled exception.
* `process.exit(1)`: If any variable is missing (e.g. no `JWT_SECRET`), it logs the exact missing field and kills the process with error code `1`.
* `export const env`: Other files import this validated `env` object with full TypeScript autocomplete.

---

### Step 3: Database & ORM Layer (Prisma 7 Setup)

* **What it is**: Modern Object-Relational Mapping (ORM) setup connecting TypeScript to MySQL/MariaDB.
* **Why Prisma 7**: Prisma 7 uses native driver adapters (`@prisma/adapter-mariadb`) and a dedicated configuration file (`prisma.config.ts`).

#### `prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "mysql"
}

model User {
  id       String @id @default(cuid())
  name     String
  email    String @unique
  password String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### `prisma.config.ts`
```typescript
import 'dotenv/config';
import { env } from './src/config/env';
import { defineConfig } from 'prisma/config';

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

#### `src/config/prisma.ts`
```typescript
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { env } from './env';

const adapter = new PrismaMariaDb({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'Shayush123?',
  database: 'syntrix',
  allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({
  adapter,
});

export default prisma;
```

#### Key Concepts Explained:
* `cuid()`: Collision-resistant unique identifiers (safer and more scalable than auto-incrementing integers `1, 2, 3...` because they don't leak account creation rates).
* `@unique`: Database-level unique constraint on `email` to guarantee no duplicate accounts.
* `allowPublicKeyRetrieval: true`: Required by MySQL 8 / MariaDB authentication plugins when connecting locally.
* Single Instance Export: Exporting a single `prisma` instance avoids exhausting database connection pool limits.

---

### Step 4: Security Utilities (`password.ts` & `jwt.ts`)

#### `src/utils/password.ts`
* **What it does**: Hashes passwords with bcrypt and verifies login passwords securely.

```typescript
import bcrypt from 'bcrypt';
import { env } from '../config/env';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
```

#### How Hashing Works:
1. **Plaintext is NEVER stored**: Even if the database is leaked, passwords cannot be recovered.
2. **Salting**: `bcrypt` generates a unique cryptographically random string (salt) for each user and mixes it into the password before hashing. This defeats **Rainbow Table attacks** (precomputed hash lookups).
3. **Cost Factor (`BCRYPT_SALT_ROUNDS=10`)**: 10 rounds means $2^{10} = 1024$ hashing iterations. This makes brute-force password guessing computationally slow for attackers while taking only ~50ms on your server.
4. **`bcrypt.compare`**: Uses constant-time string comparison to prevent **timing attacks**.

---

#### `src/utils/jwt.ts`
* **What it does**: Generates and validates JSON Web Tokens.

```typescript
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from './ApiError';
import { UserRole } from '../generated/prisma/client';

export type AccessTokenPayload = {
  userId: string;
  role: UserRole;
}

export const generateAccessToken = (userId: string, role: UserRole): string => {
  return jwt.sign({ userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    typeof (decoded as any).userId !== 'string' ||
    typeof (decoded as any).role !== 'string'
  ) {
    throw new ApiError(401, 'Invalid access token');
  }

  return {
    userId: (decoded as any).userId,
    role: (decoded as any).role,
  };
};
```

#### How JWT Works:
A JWT has 3 parts separated by dots: `header.payload.signature`
1. **Header**: Specifies the algorithm (`HS256`).
2. **Payload**: User identity data `{ "userId": "cm..." }`.
3. **Signature**: `HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), JWT_SECRET)`
* **Why it is stateless**: The server does NOT need to store sessions in memory or query the DB on every request. It mathematically verifies the signature using `JWT_SECRET`. If any user tampers with the payload, the signature check fails immediately.

---

### Step 5: Custom Error Class & Global Error Boundary

#### `src/utils/ApiError.ts`
* **What it is**: A custom error class extending JavaScript's built-in `Error`.
* **Why it exists**: Standard `new Error('message')` only holds a text message without an HTTP status code. `ApiError` pairs an HTTP status code (400, 401, 403, 404, 409) with a custom error message.

```typescript
export class ApiError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ApiError.prototype); // Restores prototype chain in TypeScript
  }
}
```

---

#### `src/utils/asyncHandler.ts`
* **What it is**: A higher-order function that wraps asynchronous Express controllers.
* **Why it exists**: In Express 4, if an `async` route handler throws an error (e.g. database goes down) and you don't explicitly call `catch(next)`, the application hangs and the request never finishes. The `asyncHandler` automatically catches rejected promises and passes them to the global `error.middleware.ts`.

```typescript
import { NextFunction, Request, Response } from 'express';
type AsyncController = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const asyncHandler = (controller: AsyncController) => {
  return (req: Request, res: Response, next: NextFunction) => {
    controller(req, res, next).catch(next);
  };
};
```

---

#### `src/middleware/error.middleware.ts`
* **What it is**: The global catch-all error handling middleware in Express.
* **Why it exists**: In Express, any middleware with **4 parameters** `(err, req, res, next)` is recognized as an error-handling middleware. When any controller or service throws an error or fails validation, execution jumps straight here.

```typescript
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export default function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err); // Server-side log for debugging

  // 1. Handled Operational Errors (ApiError)
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // 2. Zod Validation Errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      errors: err.errors,
    });
  }

  // 3. Generic Custom Thrown Errors
  if (err.message) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // 4. Unknown Server Crashes (Fallback 500)
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
}
```

---

### Step 6: Input Validation Layer (`src/validations/auth.validation.ts`)

* **What it does**: Validates client-submitted JSON body before letting any controller or database logic execute.

```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});
```

* **Security defense**: Prevents malformed requests, SQL injection strings, and invalid data types from ever reaching our database layer.

---

### Step 6.5: Validation Middleware (`src/middleware/validate.middleware.ts`)

* **What it does**: A reusable Express middleware that wraps the Zod schemas.
* **Why it exists**: Instead of manually calling `schema.parse(req.body)` inside every controller, we use this middleware to intercept the request *before* the controller. If the body is invalid, it passes the error to the global error handler (`next(result.error)`) and the controller is never executed. This keeps controllers clean and focused only on business logic!

```typescript
import { Request, Response, NextFunction } from "express";
import { z } from "zod";

export const validate = (schema: z.ZodType) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(result.error);
      return;
    }

    req.body = result.data;
    next();
  };
};
```

---

### Step 7: Data Access Layer (`src/repositories/user.repository.ts`)

* **What it does**: Encapsulates raw database queries.

```typescript
import prisma from '../config/prisma';

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
};

export const createUser = async (name: string, email: string, password: string) => {
  return prisma.user.create({
    data: {
      name,
      email,
      password,
    },
  });
};
```

* **Why isolate this**: The Service layer doesn't need to know how Prisma builds queries. If we ever switch to another ORM, or add Redis caching, we only modify this repository file without breaking any business logic.

---

### Step 8: Business Logic Layer (`src/services/auth.service.ts`)

* **What it does**: Contains all rules, validations, and security workflows for Authentication.

```typescript
import { findUserByEmail, createUser } from '../repositories/user.repository';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';

export const registerUser = async (name: string, email: string, password: string) => {
  // Rule 1: Email must be unique
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error('User already exists');
  }

  // Rule 2: Passwords must be hashed before saving
  const hashedPassword = await hashPassword(password);

  // Rule 3: Persist through Repository
  const user = await createUser(name, email, hashedPassword);

  // Rule 4: Never return the password back to the client!
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
};

export const loginUser = async (email: string, password: string) => {
  // Step 1: Locate user
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Step 2: Compare password hash
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Step 3: Strip password & generate JWT token
  const { password: _, ...userData } = user;
  const accessToken = generateAccessToken(user.id);

  return { accessToken, user: userData };
};
```

---

### Step 9: Authentication Middleware (`src/middleware/auth.middleware.ts`)

* **What it does**: Protects private routes (like `GET /api/v1/auth/me`).

```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyToken, AccessTokenPayload } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  user?: AccessTokenPayload;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // 1. Check for 'Bearer <token>' in header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    // 2. Cryptographically verify token
    const decoded = verifyToken(token);

    // 3. Attach decoded user info to the Request object
    req.user = decoded;

    // 4. Pass control to the next handler/controller
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};
```

---

### Step 10: Controller Layer (`src/controllers/auth.controller.ts`)

* **What it does**: Bridges incoming HTTP requests to our services.

```typescript
import { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const register = async (req: Request, res: Response) => {
  // 1. Destructure validated data from req.body (thanks to validate.middleware.ts!)
  const { name, email, password } = req.body;

  // 2. Call service business logic
  const user = await registerUser(name, email, password);

  // 3. Send 201 Created HTTP response
  res.status(201).json({
    success: true,
    data: user,
  });
};

export const login = async (req: Request, res: Response) => {
  // 1. Destructure validated login input
  const { email, password } = req.body;

  // 2. Perform login and token generation
  const result = await loginUser(email, password);

  // 3. Send 200 OK HTTP response
  res.status(200).json({
    success: true,
    data: result,
  });
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  // Returns user data attached by the authenticate middleware
  res.status(200).json({
    success: true,
    data: req.user,
  });
};
```

---

### Step 11: Route Organization (`src/routes/`)

#### `src/routes/auth.routes.ts`
```typescript
import { Router } from 'express';
import { register, login, getMe } from './../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const authRouter = Router();

authRouter.post('/register', asyncHandler(register));
authRouter.post('/login', asyncHandler(login));
authRouter.get('/me', authenticate, asyncHandler(getMe));

export default authRouter;
```

#### `src/routes/index.ts`
* **What it does**: Master API Router. Aggregates all modular route files (`authRoutes`, `healthRoutes`, `userRoutes`, etc.) under one umbrella.

```typescript
import { Router } from 'express';
import authRoutes from './auth.routes';
import healthRoutes from './health.routes';
import userRoutes from './user.routes';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);

export default apiRouter;
```

---

### Step 12: Typed Authenticated Context & RBAC (Role-Based Access Control)

* **What it does**: Fetches the authenticated user profile from MySQL, rather than just returning a JWT payload. Introduces Prisma `UserRole` and typed `res.locals.user` for safe downstream access.

#### `src/types/auth.types.ts`
```typescript
import { UserRole } from '../generated/prisma/client';

export type AuthenticatedUser = {
  userId: string;
  role: UserRole;
};
```

#### `src/middleware/auth.middleware.ts` (Updated)
```typescript
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken } from "../utils/jwt";
import { AuthenticatedUser } from "../types/auth.types";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    next(new ApiError(401, "Authentication required"));
    return;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    next(new ApiError(401, "Invalid authorization header"));
    return;
  }

  try {
    const payload: AuthenticatedUser = verifyAccessToken(token);
    res.locals.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};
```

#### `src/middleware/authorize.middleware.ts`
* **What it does**: Enforces Role-Based Access Control (RBAC). It checks if the `role` attached to `res.locals.user` matches any of the `allowedRoles` passed into the middleware function.

```typescript
import { Request, Response, NextFunction } from "express";
import { UserRole } from "../generated/prisma/client";
import { ApiError } from "../utils/ApiError";

export const authorize = (...allowedRoles: UserRole[]) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const user = res.locals.user;

    if (!user) {
      next(new ApiError(401, "Authentication required"));
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      next(new ApiError(403, "You do not have permission to access this resource"));
      return;
    }

    next();
  };
};
```

#### `src/controllers/user.controller.ts`
```typescript
import { Request, Response } from "express";
import { getUserById } from "../services/user.service";

export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = res.locals.user;
  const user = await getUserById(userId);

  res.status(200).json({
    success: true,
    data: user,
  });
};
```

---

### Step 12: Express App Configuration & Server Initialization

#### `src/app.ts`
* **What it does**: Assembles all global middlewares and routes.

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import apiRouter from './routes';
import errorHandler from './middleware/error.middleware';

const app = express();

// 1. Core Middlewares
app.use(express.json()); // Parses application/json body
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data
app.use(cors()); // Enables Cross-Origin requests
app.use(helmet()); // Applies secure HTTP headers
app.use(morgan('dev')); // Request logging

// 2. Versioned API Routes
app.use('/api/v1', apiRouter);

// 3. Global Error Handler (MUST BE LAST!)
app.use(errorHandler);

export default app;
```

#### `src/server.ts`
* **What it does**: Binds the configured Express `app` to a TCP port and starts listening for HTTP traffic.

```typescript
import app from './app';
import { env } from './config/env';

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});
```

* **Why separate `app.ts` from `server.ts`**:
  * `app.ts` defines the Express app without binding to a network port. This allows automated integration tests (e.g. using Supertest) to test endpoints in memory without occupying real network ports.
  * `server.ts` is purely the startup entry point for deployment.

---

## 4. Complete End-to-End Request Traces

### Trace 1: User Registration (`POST /api/v1/auth/register`)
1. Client sends `POST /api/v1/auth/register` with `{ "name": "Ayush", "email": "ayush@example.com", "password": "password123" }`.
2. `app.ts` receives request -> `morgan` logs it -> `helmet` sets security headers -> `express.json()` parses body into `req.body`.
3. Routes match `/api/v1` -> `/auth` -> `/register` -> calls `validate(registerSchema)` middleware.
4. `validate.middleware.ts` parses the body. If invalid, it passes `ZodError` to `next(err)`. If valid, it overwrites `req.body` with parsed data and calls `next()`.
5. `auth.controller.ts` `register()` is called, extracting `{ name, email, password }` directly from `req.body`.
5. `auth.controller.ts` calls `registerUser(name, email, password)` in `auth.service.ts`.
6. `auth.service.ts` calls `findUserByEmail(email)` in `user.repository.ts`.
7. `user.repository.ts` runs Prisma query `prisma.user.findUnique({ where: { email } })`.
8. `auth.service.ts`: If user does not exist, it runs `hashPassword(password)` using bcrypt with salt rounds from `env.BCRYPT_SALT_ROUNDS`.
9. `auth.service.ts` calls `createUser(...)` in `user.repository.ts` to insert the new row into MariaDB.
10. `auth.service.ts` constructs a clean object (omitting the password) and returns it.
11. `auth.controller.ts` sends `201 Created` with `{ "success": true, "data": { ... } }`.

---

### Trace 2: User Login (`POST /api/v1/auth/login`)
1. Client sends `POST /api/v1/auth/login` with email and password.
2. `validate(loginSchema)` middleware intercepts the request and checks valid email format and non-empty password.
3. `auth.controller.ts` `login()` executes, safely extracting `{ email, password }` from `req.body`.
3. `auth.service.ts`: Looks up user by email via repository. If not found, throws `Error('Invalid email or password')`.
4. `auth.service.ts`: Calls `comparePassword(password, user.password)` using bcrypt. If hash mismatch, throws `Error('Invalid email or password')`.
5. `auth.service.ts`: Calls `generateAccessToken(user.id)` from `jwt.ts` to sign a JWT valid for 15 minutes.
6. `auth.controller.ts` sends `200 OK` with `{ "success": true, "data": { "accessToken": "...", "user": { ... } } }`.

---

### Trace 3: Protected Profile Route (`GET /api/v1/users/me`)
1. Client sends `GET /api/v1/users/me` with header `Authorization: Bearer <jwt_token>`.
2. Router matches route -> triggers `authenticate` middleware in `auth.middleware.ts`.
3. `auth.middleware.ts`: Extracts token string, calls `verifyAccessToken(token)`.
4. `jwt.ts`: Verifies HMAC signature using `env.JWT_SECRET`.
5. `auth.middleware.ts`: Attaches decoded payload `{ userId }` to `res.locals.user` and calls `next()`.
6. `getCurrentUser` controller runs, reads `res.locals.user.userId`, and calls `getUserById()`.
7. `user.service.ts` fetches the user from MySQL and returns the safe profile (with `role`).
8. Controller returns `200 OK` with `{ "success": true, "data": { ... } }`.

---

## 5. Summary Cheat Sheet

| Layer | File Path | Main Job |
| :--- | :--- | :--- |
| **Config** | `src/config/env.ts` | Validates `.env` variables on startup with Zod. |
| **Database** | `src/config/prisma.ts` | Configures Prisma client with MariaDB driver adapter. |
| **Utilities** | `src/utils/` | Password hashing (`password.ts`), JWT sign/verify (`jwt.ts`), custom `ApiError.ts`. |
| **Validation** | `src/validations/` | Zod schemas for input validation before business logic runs. |
| **Repository** | `src/repositories/` | Direct database query execution using Prisma. |
| **Service** | `src/services/` | Pure business logic, authorization rules, password encryption, token creation. |
| **Middleware** | `src/middleware/` | Route authentication (`auth.middleware.ts`) & global error handler (`error.middleware.ts`). |
| **Controller** | `src/controllers/` | Reads HTTP request, validates input, calls services, sends HTTP response. |
| **Routes** | `src/routes/` | Defines HTTP endpoints and mounts middlewares and controllers. |
| **App & Server** | `src/app.ts`, `src/server.ts` | Global middleware pipeline, route mounting, port listener. |
