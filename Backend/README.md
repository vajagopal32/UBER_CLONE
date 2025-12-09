# Users API - Register Endpoint

This document describes the POST `/users/register` endpoint used to register a new user in the system.

---

## Endpoint

- Path: `POST /users/register`
- Mounted at: `app.use('/users', userRoutes)` → full path is `/users/register`
- Content-Type: `application/json`

---

## Description

Registers a new user by creating a user record and returning a generated JWT token for authentication along with the created user object (password is not returned). Password is hashed before saving.

---

## Request Body (JSON)

The request body must be in JSON format and include the following fields:

- `fullname` (object):
  - `firstname` (string) - REQUIRED. Must be at least 3 characters long.
  - `lastname` (string) - OPTIONAL. If present, must be at least 3 characters long.
- `email` (string) - REQUIRED. Must be a valid email (and unique in the database).
- `password` (string) - REQUIRED. Must be at least 6 characters long.

Example:

```json
{
  "fullname": {"firstname": "John", "lastname": "Doe"},
  "email": "john.doe@example.com",
  "password": "supersecret123"
}
```

Notes on required data and validation:
- `fullname.firstname` is required and validated in the route using express-validator with `isLength({ min: 3 })`.
- `email` is validated using express-validator `isEmail()` and should be unique in the DB (Mongoose unique constraint).
- `password` must be at least 6 characters (express-validator `isLength({ min: 6 })`).

The service also checks for required fields (firstname, email, password) and will throw an error if missing.

---

## Status Codes & Responses

- 201 Created
  - Success: user created, token issued
  - Response body (example):

```json
{
  "token": "<JWT_TOKEN>",
  "user": {
    "_id": "60d2f...f6e",
    "fullname": {
      "firstname": "John",
      "lastname": "Doe"
    },
    "email": "john.doe@example.com",
    "socketId": null
  }
}
```

Example full response with realistic values (201):

```json
HTTP/1.1 201 Created
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...",
  "user": {
    "_id": "6471b2a0d55b9a2c1a4ef12f",
    "fullname": {
      "firstname": "John",
      "lastname": "Doe"
    },
    "email": "john.doe@example.com",
    "socketId": null
  }
}
```

- 400 Bad Request
  - Validation errors from `express-validator` or missing required fields
  - Response body format (example):

```json
{
  "errors": [
    {"msg": "Invelid Email","param":"email","location":"body"},
    {"msg":"Password must be at least 6 charecters long","param":"password","location":"body"}
  ]
}
```

Example validation error response (400):

```json
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "errors": [
    {
      "msg": "Invelid Email",
      "param": "email",
      "location": "body"
    },
    {
      "msg": "First name must be at least 3 charecters long",
      "param": "fullname.firstname",
      "location": "body"
    }
  ]
}
```

- 409 Conflict (possible)
  - If the email already exists and the DB rejects the duplicate key. Application currently relies on Mongoose to enforce unique email.
  - May be returned as a 500-level error if not explicitly handled in code, but clients should expect a duplicate email to result in an error.

- 500 Internal Server Error
  - For other server-side errors (DB connection issues, unexpected exceptions).

Example duplicate email response (409):

```json
HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "error": "User with this email already exists"
}
```

Example server error response (500):

```json
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "error": "An unexpected error occurred. Please try again later."
}
```

---

## Example Requests

Curl:

```bash
curl -X POST "http://localhost:3000/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": {"firstname": "John", "lastname": "Doe"},
    "email": "john.doe@example.com",
    "password": "supersecret123"
  }'
```

Postman / Fetch / Any HTTP client can use the JSON body above.

### How to GET user data (example)

The registration endpoint returns a `token` and a `user` object. You can use the `token` to request user data from a protected GET endpoint like `GET /users/:id` or `GET /users/me` (note: this repo may not currently implement a GET profile endpoint; the example below shows the expected shape and usage).

Example: GET user by id using the token

```bash
curl -X GET "http://localhost:3000/users/6471b2a0d55b9a2c1a4ef12f" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ..." \
  -H "Content-Type: application/json"
```

Example GET 200 OK response (user profile):

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "user": {
    "_id": "6471b2a0d55b9a2c1a4ef12f",
    "fullname": {
      "firstname": "John",
      "lastname": "Doe"
    },
    "email": "john.doe@example.com",
    "socketId": null
  }
}
```

Client snippet: Use register response to GET profile

```js
// Example (browser/Node fetch) - using the token returned by POST /users/register
fetch('http://localhost:3000/users/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fullname: { firstname: 'John', lastname: 'Doe' }, email: 'john.doe@example.com', password: 'supersecret123' })
})
  .then(res => res.json())
  .then(({ token, user }) => {
    // store token for future requests
    localStorage.setItem('token', token);

    // Example of fetching the user's own profile by id
    return fetch(`http://localhost:3000/users/${user._id}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  })
  .then(res => res.json())
  .then(profile => console.log('profile', profile));
```

---

## Notes & Implementation Details

- The password provided is hashed before saving using `userModel.hashPassword`.
- The returned token is generated using `user.generateAuthToken()` (JWT with secret from `process.env.JWT_SECRET`).
- The created user object is returned in the response; the Mongoose model sets `password.select = false`, so the saved password should not be returned to the client.
- Any client should store the `token` for authenticated requests.

---

If you want me to also add a short Postman collection or test endpoint script, I can add those next.

---

## Login Endpoint

This document describes the POST `/users/login` endpoint used to authenticate an existing user and issue a JWT token.

### Endpoint

- Path: `POST /users/login`
- Mounted at: `app.use('/users', userRoutes)` → full path is `/users/login`
- Content-Type: `application/json`

### Description

Authenticates a user using `email` and `password`. On success, returns a JWT token and the user object. If the credentials are invalid, returns a 401 Unauthorized with an error message.

### Request Body (JSON)

- `email` (string) - REQUIRED. Must be a valid email.
- `password` (string) - REQUIRED. Must be at least 6 characters long.

Example request:

```json
{
  "email": "john.doe@example.com",
  "password": "supersecret123"
}
```

Validation (from `routes/user.routes.js`):
- `email` is validated with `isEmail()` and emits the message: `Invaalid Email` on failure.
- `password` is validated with `isLength({min:6})` and emits the message: `password 6 length` on failure.

### Status Codes & Responses

- 200 OK
  - Success: user authenticated, token issued.
  - Example success response (200):

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...",
  "user": {
    "_id": "6471b2a0d55b9a2c1a4ef12f",
    "fullname": {
      "firstname": "John",
      "lastname": "Doe"
    },
    "email": "john.doe@example.com",
    "socketId": null
  }
}
```

- 400 Bad Request
  - Validation errors from `express-validator` (e.g., invalid email format, too-short password) will return a 400.
  - Example 400 response (validation errors):

```json
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "errors": [
    { "msg": "Invaalid Email", "param": "email", "location": "body" },
    { "msg": "password 6 length", "param": "password", "location": "body" }
  ]
}
```

- 401 Unauthorized
  - Wrong email or password.
  - Note: The current implementation returns a JSON body with a `massage` field (typo) for invalid credentials.
  - Example 401 response:

```json
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "massage": "Invalid email or password"
}
```

### Example request (curl)

```bash
curl -X POST "http://localhost:3000/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "john.doe@example.com", "password": "supersecret123"}'
```

### Client Example (fetch)

```js
fetch('http://localhost:3000/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'john.doe@example.com', password: 'supersecret123' })
})
  .then(res => res.json())
  .then(({ token, user }) => {
    // store token and use it for subsequent authenticated requests
    localStorage.setItem('token', token);
    console.log('Logged in user', user);
  })
  .catch(err => console.error(err));
```

### Notes

- The controller explicitly selects `password` when loading the user to compare it using `user.comparePassword()` (see controller). The password is not removed from the object automatically — to fully avoid returning the password, explicitly remove it before responding, or rely on `select:false` during query instead of selecting the password back in the returned document.
- The controller currently returns `massage` in error responses for authentication failure — you may want to change that to `message` for clarity.

---

## Profile Endpoint

This document describes the GET `/users/profile` endpoint used to retrieve the authenticated user's profile information.

### Endpoint

- Path: `GET /users/profile`
- Mounted at: `app.use('/users', userRoutes)` → full path is `/users/profile`
- Authentication: **REQUIRED** — Must include a valid JWT token in the `Authorization` header.
- Content-Type: `application/json`

### Description

Retrieves the authenticated user's profile information. This endpoint is protected and requires a valid JWT token obtained from login or registration. The middleware `authMiddleware.authUser` validates the token and attaches the user object to the request.

### Request

No request body is required. The token must be included in the `Authorization` header.

Example request header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...
```

### Status Codes & Responses

- 200 OK
  - Success: returns the authenticated user's profile.
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
  "email": "john.doe@example.com",
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
curl -X GET "http://localhost:3000/users/profile" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ..." \
  -H "Content-Type: application/json"
```

### Client Example (fetch)

```js
fetch('http://localhost:3000/users/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
  .then(res => res.json())
  .then(profile => {
    console.log('User profile:', profile);
  })
  .catch(err => console.error('Error fetching profile:', err));
```

### Notes

- The token should be stored securely on the client (e.g., in `localStorage` or a secure cookie) after login or registration.
- The authentication middleware (`authMiddleware.authUser`) decodes the token and attaches the user object to `req.user`.
- Returns the user object directly without the password (password is protected by `select: false` in the model).

---

## Logout Endpoint

This document describes the GET `/users/logout` endpoint used to invalidate a user's JWT token by blacklisting it.

### Endpoint

- Path: `GET /users/logout`
- Mounted at: `app.use('/users', userRoutes)` → full path is `/users/logout`
- Authentication: **REQUIRED** — Must include a valid JWT token in the `Authorization` header or cookie.
- Content-Type: `application/json`

### Description

Logs out the authenticated user by blacklisting their JWT token. The token is added to the blacklist collection with a TTL of 24 hours, after which it expires automatically. The endpoint also clears the token cookie (if set).

### Request

No request body is required. The token must be included in either:
- `Authorization` header: `Authorization: Bearer <token>`
- Or a `token` cookie

### Status Codes & Responses

- 200 OK
  - Success: token blacklisted and user logged out.
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
curl -X GET "http://localhost:3000/users/logout" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ..." \
  -H "Content-Type: application/json"
```

### Client Example (fetch)

```js
fetch('http://localhost:3000/users/logout', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
  .then(res => res.json())
  .then(data => {
    // Clear local storage
    localStorage.removeItem('token');
    console.log('Logout successful:', data);
    // Redirect to login page or home
    // window.location.href = '/login';
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
