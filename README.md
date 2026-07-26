# HireBoard Backend

Backend API for the **HireBoard – CV Management System**, a full-stack recruitment platform that enables administrators, recruiters, and candidates to manage users, positions, CVs, and dynamic profile attributes.

---

## Overview

The backend is built with **Node.js**, **Express**, **TypeScript**, **Prisma ORM**, and **PostgreSQL**.

It provides a secure REST API with JWT authentication, OAuth integration, role-based authorization, file uploads, optimistic locking, and dynamic CV generation.

---

# Features

## Authentication

- JWT Authentication
- Google OAuth 2.0
- GitHub OAuth
- Secure password hashing with bcrypt
- Protected API endpoints

---

## User Management

- Register users
- Login
- Get current user
- Manage candidates
- Manage recruiters
- Block and unblock users
- Change user roles
- Bulk operations

---

## Candidate Profiles

- Update personal information
- Upload avatar
- Dynamic profile attributes
- Image attributes
- Optimistic locking using `updatedAt`
- Profile search

---

## Position Management

- Create positions
- Update positions
- Archive positions
- Search positions
- Position levels
- Required attributes

---

## CV Management

- Create CVs
- Update CVs
- Read-only mode
- Automatic synchronization with position attributes
- Dynamic attribute values
- Completion tracking

---

## Attribute Library

Reusable attributes shared across the system.

Supported attribute types include:

- String
- Text
- Number
- Boolean
- Date
- Period
- Image
- Select

---

## Dashboard Statistics

Provides summary information for the frontend dashboard.

Examples:

- New CVs
- Total CVs
- Candidates
- Recruiters
- Positions

---

## File Uploads

Implemented using **Multer**.

Supports:

- User avatars
- Image attributes

---

## Security

- JWT Authentication
- OAuth Authentication
- Role-based Authorization
- Request Validation
- Password Hashing
- Optimistic Locking
- Protected Routes

---

# Tech Stack

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Passport.js
- JWT
- Google OAuth
- GitHub OAuth
- Multer
- Zod
- Supabase Storage

---

# Project Structure

```
src/
│
├── config/
├── controllers/
├── middleware/
├── prisma/
├── routes/
├── utils/
├── app.ts
└── server.ts

prisma/
├── migrations/
└── schema.prisma
```

---

# Database

The project uses **PostgreSQL** with **Prisma ORM**.

Main entities include:

- User
- Position
- CV
- Attribute
- AttributeValue
- Tag
- Project

---

# Authentication

### JWT

After successful login, the server returns a JWT token that must be included in every protected request.

```
Authorization: Bearer <token>
```

---

### OAuth

Supported providers:

- Google
- GitHub

OAuth users are automatically created if they do not already exist.

---

# Validation

The API validates incoming requests using **Zod** before processing them.

Validation covers:

- Authentication
- User updates
- Positions
- Attributes
- CV Builder
- Route parameters
- Query parameters

---

# File Storage

Uploaded files are stored using **Supabase Storage**.

Supported uploads:

- Profile avatars
- Image attribute values

---

# Installation

Clone the repository

```bash
git clone https://github.com/ShohjahonAhmad/cv-management-backend.git
```

Install dependencies

```bash
npm install
```

---

# Environment Variables

Create a `.env` file.

```env
DATABASE_URL=

JWT_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

FRONTEND_URL=
API_URL=

SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_BUCKET=
```

---

# Database

Generate Prisma Client

```bash
npx prisma generate
```

Run migrations

```bash
npx prisma migrate deploy
```

or during development

```bash
npx prisma migrate dev
```

---

# Running the Server

Development

```bash
npm run dev
```

Production

```bash
npm run build
npm start
```

---

# API Modules

- Authentication
- Users
- Candidate Profiles
- Positions
- CV Builder
- Attributes
- Tags
- Statistics

---

# Main Middleware

- Authentication
- Authorization
- Validation
- Multer Uploads
- Error Handling

---

# Error Handling

The API returns standard HTTP status codes.

| Status | Description                   |
| -----: | ----------------------------- |
|    200 | Success                       |
|    201 | Resource Created              |
|    400 | Validation Error              |
|    401 | Unauthorized                  |
|    403 | Forbidden                     |
|    404 | Resource Not Found            |
|    409 | Conflict (Optimistic Locking) |
|    500 | Internal Server Error         |

---

# Development Highlights

- Modular Express architecture
- Prisma ORM with migrations
- RESTful API design
- Dynamic attribute system
- Optimistic concurrency control
- Secure authentication and authorization
- File uploads with cloud storage
- Scalable project structure

---

# Related Project

Frontend Repository:

https://github.com/ShohjahonAhmad/cv-management

---

# Author

**Shohjahon Ahmad**

GitHub: https://github.com/ShohjahonAhmad

---

# License

This project was developed as a itransition final project for internship purposes.
