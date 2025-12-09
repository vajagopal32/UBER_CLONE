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