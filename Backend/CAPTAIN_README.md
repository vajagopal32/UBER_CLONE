# Captains API - Endpoints Documentation

This document describes all the POST, GET endpoints for captain authentication and profile management.

---

## Table of Contents
1. [Register Endpoint](#register-endpoint)
2. [Login Endpoint](#login-endpoint)
3. [Profile Endpoint](#profile-endpoint)
4. [Logout Endpoint](#logout-endpoint)

---

## Register Endpoint

This document describes the POST `/captains/register` endpoint used to register a new captain in the system.

### Endpoint

- Path: `POST /captains/register`
- Mounted at: `app.use('/captains', captainRoutes)` → full path is `/captains/register`
- Content-Type: `application/json`

### Description

Registers a new captain by creating a captain record with vehicle information and returning a generated JWT token for authentication along with the created captain object. Password is hashed before saving.

### Request Body (JSON)

The request body must be in JSON format and include the following fields:

- `fullname` (object):
  - `firstname` (string) - REQUIRED. Must be at least 3 characters long.
  - `lastname` (string) - OPTIONAL. If present, must be at least 3 characters long.
- `email` (string) - REQUIRED. Must be a valid email (and unique in the database).
- `password` (string) - REQUIRED. Must be at least 6 characters long.
- `vehicle` (object) - REQUIRED. Must include all vehicle details:
  - `color` (string) - REQUIRED. Must be at least 3 characters long.
  - `plate` (string) - REQUIRED. Must be at least 3 characters long.
  - `capacity` (number) - REQUIRED. Must be at least 1.
  - `vehicleType` (string) - REQUIRED. Must be one of: `car`, `motorcycle`, `auto`.

Example request:

```json
{
  "fullname": {
    "firstname": "John",
    "lastname": "Doe"
  },
  "email": "john.captain@example.com",
  "password": "securepass123",
  "vehicle": {
    "color": "Black",
    "plate": "ABC123",
    "capacity": 4,
    "vehicleType": "car"
  }
}
```

Validation Rules:
- `email` must be a valid email format.
- `fullname.firstname` must be at least 3 characters long.
- `password` must be at least 6 characters long.
- `vehicle.color` must be at least 3 characters long.
- `vehicle.plate` must be at least 3 characters long.
- `vehicle.capacity` must be an integer with minimum value of 1.
- `vehicle.vehicleType` must be one of the allowed types: `car`, `motorcycle`, `auto`.

### Status Codes & Responses

- 201 Created
  - Success: captain created, token issued.
  - Example response (201):

```json
HTTP/1.1 201 Created
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...",
  "captain": {
    "_id": "6471b2a0d55b9a2c1a4ef12f",
    "fullname": {
      "firstname": "John",
      "lastname": "Doe"
    },
    "email": "john.captain@example.com",
    "status": "inactive",
    "vehicle": {
      "color": "Black",
      "plate": "ABC123",
      "capacity": 4,
      "vehicleType": "car"
    },
    "location": {
      "ltd": null,
      "lng": null
    },
    "socketId": null
  }
}
```

- 400 Bad Request
  - Validation errors from `express-validator` or captain already exists.
  - Example response for validation errors (400):

```json
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "errors": [
    {
      "msg": "Invalid Email",
      "param": "email",
      "location": "body"
    },
    {
      "msg": "First name must be at least 3 characters long",
      "param": "fullname.firstname",
      "location": "body"
    }
  ]
}
```

- 400 Bad Request
  - Example response for duplicate email (400):

```json
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "message": "Captain already exist"
}
```

### Example request (curl)

```bash
curl -X POST "http://localhost:3000/captains/register" \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": {"firstname": "John", "lastname": "Doe"},
    "email": "john.captain@example.com",
    "password": "securepass123",
    "vehicle": {
      "color": "Black",
      "plate": "ABC123",
      "capacity": 4,
      "vehicleType": "car"
    }
  }'
```

### Client Example (fetch)

```js
fetch('http://localhost:3000/captains/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fullname: { firstname: 'John', lastname: 'Doe' },
    email: 'john.captain@example.com',
    password: 'securepass123',
    vehicle: {
      color: 'Black',
      plate: 'ABC123',
      capacity: 4,
      vehicleType: 'car'
    }
  })
})
  .then(res => res.json())
  .then(({ token, captain }) => {
    localStorage.setItem('captainToken', token);
    console.log('Captain registered:', captain);
  })
  .catch(err => console.error(err));
```

### Notes

- The password is hashed before saving using `captainModel.hashPassword()`.
- The returned token is generated using `captain.generateAuthToken()` (JWT with 24-hour expiration).
- Captain status defaults to `inactive` and can be updated to `active`.
- The captain can have location coordinates (`location.ltd`, `location.lng`) which can be set during rides.
- The password is not returned in the response (protected by `select: false` in the model).

---

## Login Endpoint

This document describes the POST `/captains/login` endpoint used to authenticate an existing captain and issue a JWT token.

### Endpoint

- Path: `POST /captains/login`
- Mounted at: `app.use('/captains', captainRoutes)` → full path is `/captains/login`
- Content-Type: `application/json`

### Description

Authenticates a captain using `email` and `password`. On success, returns a JWT token and the captain object. If the credentials are invalid, returns a 401 Unauthorized with an error message.

### Request Body (JSON)

- `email` (string) - REQUIRED. Must be a valid email.
- `password` (string) - REQUIRED. Must be at least 6 characters long.

Example request:

```json
{
  "email": "john.captain@example.com",
  "password": "securepass123"
}
```

Validation:
- `email` must be a valid email format.
- `password` must be at least 6 characters long.

### Status Codes & Responses

- 200 OK
  - Success: captain authenticated, token issued.
  - Example response (200):

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...",
  "captain": {
    "_id": "6471b2a0d55b9a2c1a4ef12f",
    "fullname": {
      "firstname": "John",
      "lastname": "Doe"
    },
    "email": "john.captain@example.com",
    "status": "inactive",
    "vehicle": {
      "color": "Black",
      "plate": "ABC123",
      "capacity": 4,
      "vehicleType": "car"
    },
    "location": {
      "ltd": null,
      "lng": null
    },
    "socketId": null
  }
}
```

- 400 Bad Request
  - Validation errors from `express-validator`.
  - Example response (400):

```json
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "errors": [
    { "msg": "Invalid Email", "param": "email", "location": "body" },
    { "msg": "Password must be at least 6 characters long", "param": "password", "location": "body" }
  ]
}
```

- 401 Unauthorized
  - Wrong email or password.
  - Example response (401):

```json
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "message": "Invalid email or password"
}
```

### Example request (curl)

```bash
curl -X POST "http://localhost:3000/captains/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "john.captain@example.com", "password": "securepass123"}'
```

### Client Example (fetch)

```js
fetch('http://localhost:3000/captains/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john.captain@example.com',
    password: 'securepass123'
  })
})
  .then(res => res.json())
  .then(({ token, captain }) => {
    localStorage.setItem('captainToken', token);
    console.log('Captain logged in:', captain);
  })
  .catch(err => console.error('Login error:', err));
```

### Notes

- The authentication middleware (`authMiddleware.authCaptain`) decodes the token and validates it.
- The password field is excluded from the response for security.
- Token is valid for 24 hours from issuance.

---

## Profile Endpoint

This document describes the GET `/captains/profile` endpoint used to retrieve the authenticated captain's profile information.

### Endpoint

- Path: `GET /captains/profile`
- Mounted at: `app.use('/captains', captainRoutes)` → full path is `/captains/profile`
- Authentication: **REQUIRED** — Must include a valid JWT token in the `Authorization` header.
- Content-Type: `application/json`

### Description

Retrieves the authenticated captain's profile information including vehicle details, status, and location. This endpoint is protected and requires a valid JWT token obtained from captain login or registration. The middleware `authMiddleware.authCaptain` validates the token and attaches the captain object to the request.

### Request

No request body is required. The token must be included in the `Authorization` header.

Example request header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...
```

### Status Codes & Responses

- 200 OK
  - Success: returns the authenticated captain's profile.
  - Example response (200):

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "_id": "6471b2a0d55b9a2c1a4ef12f",
  "fullname": {
    "firstname": "John",
    "lastname": "Doe"
  },
  "email": "john.captain@example.com",
  "status": "inactive",
  "vehicle": {
    "color": "Black",
    "plate": "ABC123",
    "capacity": 4,
    "vehicleType": "car"
  },
  "location": {
    "ltd": 40.7128,
    "lng": -74.0060
  },
  "socketId": null
}
```

- 401 Unauthorized
  - Token is missing, invalid, or expired.
  - Example response (401):

```json
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Unauthorized"
}
```

### Example request (curl)

```bash
curl -X GET "http://localhost:3000/captains/profile" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ..." \
  -H "Content-Type: application/json"
```

### Client Example (fetch)

```js
fetch('http://localhost:3000/captains/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('captainToken')}`,
    'Content-Type': 'application/json'
  }
})
  .then(res => res.json())
  .then(profile => {
    console.log('Captain profile:', profile);
  })
  .catch(err => console.error('Error fetching profile:', err));
```

### Notes

- The token should be stored securely on the client (e.g., in `localStorage`) after login or registration.
- The authentication middleware (`authMiddleware.authCaptain`) decodes the token and attaches the captain object to `req.captain`.
- Returns the full captain object without the password (password is protected by `select: false` in the model).
- Location coordinates will be null unless updated during an active ride.

---

## Logout Endpoint

This document describes the GET `/captains/logout` endpoint used to invalidate a captain's JWT token by blacklisting it.

### Endpoint

- Path: `GET /captains/logout`
- Mounted at: `app.use('/captains', captainRoutes)` → full path is `/captains/logout`
- Authentication: **REQUIRED** — Must include a valid JWT token in the `Authorization` header or cookie.
- Content-Type: `application/json`

### Description

Logs out the authenticated captain by blacklisting their JWT token. The token is added to the blacklist collection with a TTL of 24 hours, after which it expires automatically. The endpoint also clears the token cookie (if set).

### Request

No request body is required. The token must be included in either:
- `Authorization` header: `Authorization: Bearer <token>`
- Or a `token` cookie

### Status Codes & Responses

- 200 OK
  - Success: token blacklisted and captain logged out.
  - Example response (200):

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Logged out"
}
```

- 401 Unauthorized
  - Token is missing, invalid, or expired.
  - Example response (401):

```json
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Unauthorized"
}
```

### Example request (curl)

```bash
curl -X GET "http://localhost:3000/captains/logout" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ..." \
  -H "Content-Type: application/json"
```

### Client Example (fetch)

```js
fetch('http://localhost:3000/captains/logout', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('captainToken')}`,
    'Content-Type': 'application/json'
  }
})
  .then(res => res.json())
  .then(data => {
    // Clear local storage
    localStorage.removeItem('captainToken');
    console.log('Logout successful:', data);
    // Redirect to login page or home
    // window.location.href = '/captain-login';
  })
  .catch(err => console.error('Logout error:', err));
```

### Notes

- The token is blacklisted in the `BlacklistToken` collection with a TTL (time-to-live) of 24 hours.
- After 24 hours, the blacklist entry automatically expires and is removed from the database.
- For additional security, you may want to:
  - Verify the token in the blacklist before allowing authenticated requests (check `authMiddleware`).
  - Clear client-side storage (`localStorage`, `sessionStorage`, or cookies) after logout.
  - Implement a proper authentication middleware that checks the blacklist.
- The endpoint clears the `token` cookie if it was set via `res.clearCookie()` during login.

---

## Summary of Captain Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/captains/register` | No | Register a new captain with vehicle details |
| POST | `/captains/login` | No | Authenticate captain and get token |
| GET | `/captains/profile` | Yes | Get authenticated captain's profile |
| GET | `/captains/logout` | Yes | Logout and blacklist the captain's token |

---

## Authentication Flow

1. **Register**: POST `/captains/register` → Receive `token` and `captain` object
2. **Store Token**: Save token in `localStorage` as `captainToken`
3. **Access Profile**: GET `/captains/profile` with `Authorization: Bearer <token>`
4. **Logout**: GET `/captains/logout` with `Authorization: Bearer <token>` → Token blacklisted, removed from storage

---

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Successful operation
- `201` - Resource created successfully
- `400` - Validation errors or bad request
- `401` - Unauthorized (missing/invalid token)
- `500` - Server error
