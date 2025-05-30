# Installation

NestJS Boilerplate uses [TypeORM](https://www.npmjs.com/package/typeorm) with [PostgreSQL](https://www.postgresql.org/) as the main database.

---

## Table of Contents <!-- omit in toc -->

- [Comfortable development](#comfortable-development)
  - [Video guideline](#video-guideline)
- [Quick run](#quick-run)
- [Links](#links)

---

## Comfortable development

1. Clone repository

   ```bash
   git clone --depth 1 https://github.com/brocoders/nestjs-boilerplate.git my-app
   ```

1. Go to folder, and copy `env-example-relational` as `.env`.

   ```bash
   cd my-app/
   cp env-example-relational .env
   ```

1. Change `DATABASE_HOST=postgres` to `DATABASE_HOST=localhost`

   Change `MAIL_HOST=maildev` to `MAIL_HOST=localhost`

1. Run additional container:

   ```bash
   docker compose up -d postgres adminer maildev
   ```

   //borrar todo
   docker-compose down --volumes --rmi all

1. Install dependency

   ```bash
   npm install
   ```

1. Run app configuration

   > You should run this command only the first time on initialization of your project, all next time skip it.

   > If you want to contribute to the boilerplate, you should NOT run this command.

   ```bash
   npm run app:config
   ```

1. Run migrations

   ```bash
   npm run migration:run
   ```

1. Run seeds

   ```bash
   npm run seed:run:relational
   ```

1. Run app in dev mode

   ```bash
   npm run start:dev
   ```

1. Open <http://localhost:3000>

### Video guideline

<https://github.com/user-attachments/assets/136a16aa-f94a-4b20-8eaf-6b4262964315>

---

## Quick run

If you want quick run your app, you can use following commands:

1. Clone repository

   ```bash
   git clone --depth 1 https://github.com/brocoders/nestjs-boilerplate.git my-app
   ```

1. Go to folder, and copy `env-example-relational` as `.env`.

   ```bash
   cd my-app/
   cp env-example-relational .env
   ```

1. Run containers

   ```bash
   docker compose up -d
   ```

1. For check status run

   ```bash
   docker compose logs
   ```

1. Open <http://localhost:3000>

---

## Links

- Swagger (API docs): <http://localhost:3000/docs>
- Adminer (client for DB): <http://localhost:8080>
- Maildev: <http://localhost:1080>

---

Previous: [Introduction](introduction.md)

Next: [Architecture](architecture.md)

npx eslint --fix src/categories/**/\*.ts src/subcategories/**/\*.ts
