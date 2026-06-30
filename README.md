# Pharmacy APP

This repository contains both the **React Frontend** and the **Spring Boot Microservices Backend** for the Pharmacy application.

---

## Repository Structure

```
├── backend/            # Spring Boot Microservices
├── pharmacy/           # React Frontend Application
```

---

## 1. Backend Services

Spring Boot **microservices** backend for the Pharmacy APP React app.
This iteration delivers a complete, production-shaped **Authentication + Profile** stack (local email/password **and** Google sign-in) backed by **MySQL**.

### Tech stack

- Java 21, Spring Boot 3.3.x, Spring Cloud 2023.0.x
- Spring Security + OAuth2 Client (Google), JWT (JJWT 0.12)
- Spring Data JPA + MySQL 8
- Netflix Eureka (discovery) + Spring Cloud Gateway
- springdoc-openapi (Swagger UI)

### Services & ports

| Service          | Port | Notes                                  |
|------------------|------|----------------------------------------|
| eureka-server    | 8761 | Service discovery — **start first**    |
| api-gateway      | 8089 | Single entry point — the React app talks here |
| auth-service     | 8081 | Auth, Google login, profile, MySQL     |
| product/cart/order/payment | 8082-8085 | Microservices endpoints |

### Configuration

Set these environment variables before running the microservices:

| Variable | Default | Purpose |
|----------|---------|---------|
| `DB_HOST` / `DB_PORT` / `DB_NAME` | `localhost` / `3306` / `pharmacy_auth` | MySQL connection |
| `DB_USERNAME` / `DB_PASSWORD` | `root` / `2205` | MySQL credentials |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | placeholders | Google OAuth2 client |

### Running the Backend

Use the interactive launcher:
```powershell
# from backend/
.\run.ps1
```

---

## 2. Frontend Application

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Available Scripts

In the frontend directory, you can run:

#### `npm start`

Runs the app in development mode at [http://localhost:3000](http://localhost:3000).

#### `npm run build`

Builds the app for production to the `build` folder.
