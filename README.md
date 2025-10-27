# Accounts Receivable Management Next.js Application

This project is a web application designed for a micro-lending company to optimize their accounts receivable management. It provides features for Finance Managers to create and track invoices, while allowing customers to view and pay their invoices seamlessly.

## Features

### Finance Manager (Creditor) Functions

1. **Authentication**: Secure login for Finance Managers.
2. **Create Invoices**: Generate new invoices with details such as:
   - Unique Invoice Identifier
   - Customer Information (Name, Contact Details)
   - Invoice Date
   - Due Date
   - Amount Due
   - Payment Status
3. **View Invoices**: Comprehensive record of all invoices with search and filter capabilities.
4. **Generate Payment Links**: Create payment links for invoices to simplify the payment process for customers.

### Customer (Debtor) Functions

1. **No Login Required**: Customers can access their invoices without logging in.
2. **Pay Through Payment Links**: Customers can make payments using the provided payment links.

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- PostgreSQL (version 12 or higher)

### Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   cd accounts-receivable-management-next
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Set up the database:

   - Create a PostgreSQL database.
   - Update the `.env.example` file with your database connection string and rename it to `.env`.

4. Run the Prisma migrations:

   ```
   npx prisma migrate dev --name init
   ```

5. Seed the database with initial data:
   ```
   npx prisma db seed
   ```

### Running the Application

To start the development server, run:

```
npm run dev
```

The application will be available at `http://localhost:3000`.

## Testing

The application includes various test cases for both Finance Manager and Customer functionalities. Ensure to test the following scenarios:

- Successful and failed login attempts.
- Creation of invoices with valid and invalid data.
- Viewing, searching, and filtering invoices.
- Generating payment links and processing payments.

## Docker (Development / Local)

This repository includes configuration to run the app locally with Docker and Docker Compose. It will start a Postgres database and the Next.js app.

Files provided:

- `Dockerfile` - builds a production-ready Next.js image (used by Compose for convenience).
- `docker-compose.yml` - orchestrates a Postgres service and the Next.js app.

Prerequisites

- Docker
- Docker Compose (most Docker installations include it)

Quickstart (development-like)

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to `postgresql://postgres:postgres@db:5432/ar_db?schema=public` and set `JWT_SECRET`.
2. Start services:

```powershell
docker-compose up --build
```

3. Run Prisma migrations and seed (inside the running app container):

```powershell
# open a shell in the running web container (replace container name if different)
docker-compose exec web sh
npx prisma migrate dev --name init
npx prisma db seed
exit
```

4. Open the app at `http://localhost:3000`.

Notes

- The compose setup maps Postgres default port 5432 to the host. If you already have Postgres running locally, stop it or change ports.
- The Dockerfile is optimized for small changes in development and for building a production image. Adjust NODE_ENV or commands as needed.

## Design decisions and architecture

High level

- Next.js (Pages Router) for server-rendered pages and API routes under `src/pages/api/`.
- Prisma ORM with PostgreSQL for persistence. Singleton Prisma client located in `src/lib/prisma.ts`.
- Authentication: custom JWT stored in an httpOnly cookie named `token`. Handled by `POST /api/auth` and `GET /api/auth` endpoints.
- Payment links: `POST /api/payment-links` creates (or refreshes via upsert) a link tied one-to-one with an invoice. Customers visit `/invoices/[token]` to view and pay without logging in.
- Validation: Basic server-side validation exists; for production a schema validation library (zod) is recommended and can be added.

Key files

- `src/pages/api/invoices.ts` - list/create invoices. Normalizes DB values (Date -> ISO string, Decimal -> string) for client consumption.
- `src/pages/api/payment-links/index.ts` - creates a payment link using Prisma upsert to avoid unique-constraint errors when regenerating links.
- `src/pages/api/payment-links/[token].ts` - validates token (supports demo `sample-token`), returns invoice and link metadata.
- `src/pages/api/payment-links/use.ts` - marks link used and updates invoice status to `paid`.
- `src/components/InvoiceForm.tsx` - react-hook-form-powered create/update invoice form with datepickers.
- `src/components/Header.tsx` - manager navbar with basic auth detection and logout.
- `src/pages/invoices/[token].tsx` - customer-facing payment page with countdown and dark styling for payment pages.

Security notes

- Keep `JWT_SECRET` strong and not checked into source control.
- In production, set `NEXT_PUBLIC_APP_URL` to the app's public URL so payment links are generated correctly.

Running tests

Install dependencies locally then run:

```powershell
npm install
npm run test
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
