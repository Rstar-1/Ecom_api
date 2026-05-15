# Security Documentation

## Overview

This document covers authentication, JWT implementation, role-based access control (RBAC), and security best practices for the e-commerce platform.

---

## JWT Authentication

### Token Structure

A JWT consists of three parts separated by dots (`.`):

```
header.payload.signature
```

#### Header
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

#### Payload
```json
{
  "user_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": "customer",
  "iat": 1713607200,
  "exp": 1713610800,
  "iss": "ecommerce-auth-service",
  "aud": "ecommerce-gateway"
}
```

#### Signature
```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret_key
)
```

### Token Lifecycle

1. **Generation**: User logs in, Auth Service creates JWT
2. **Storage**: Client stores token (localStorage, sessionStorage, or secure cookie)
3. **Usage**: Client includes token in Authorization header
4. **Validation**: Gateway validates token on each request
5. **Expiration**: Token expires after configured time (default: 24 hours)
6. **Refresh**: Client can refresh token before expiration

### Token Configuration

```env
JWT_SECRET=your_secret_key_min_32_characters_long
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d
```

### Token Validation

```javascript
const verifyToken = (token, secret) => {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
};
```

---

## Role-Based Access Control (RBAC)

### User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **customer** | Regular user | Browse products, create orders, manage cart |
| **admin** | Administrator | Manage users, products, orders |
| **vendor** | Seller | Manage own products, view sales |
| **moderator** | Content moderator | Manage reviews, handle disputes |

### Role Permissions Matrix

| Resource | Customer | Vendor | Admin | Moderator |
|----------|----------|--------|-------|-----------|
| Users | View self | View self | Full | View |
| Products | Read | Create/Edit own | Full | View |
| Orders | Own orders | View own sales | Full | View |
| Reviews | Create | View own | Full | Moderate |
| Reports | Create | View own | Full | Handle |

### Permission Middleware

```javascript
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
    }
    
    next();
  };
};

// Usage
app.post('/admin/users', requireRole(['admin']), controller.createUser);
```

---

## Authentication Flow

### Login Process
1. Client sends email and password
2. Auth Service verifies credentials
3. If valid:
   - Generate JWT token
   - Publish user.logged_in event
   - Return token to client
4. If invalid:
   - Return 401 Unauthorized
   - Log failed attempt

### Authorization Process
1. Client sends request with Authorization header
2. Gateway extracts and validates JWT
3. If valid:
   - Decode token
   - Attach user data to request
   - Forward to service
4. If invalid:
   - Return 401 Unauthorized
   - Clear client token

---

## Security Best Practices

### Password Security
- Minimum 8 characters
- Must contain: uppercase, lowercase, numbers, special chars
- Hash using bcrypt with salt rounds ≥ 10
- Never store plain text passwords
- Implement rate limiting on login attempts

### Token Security
- Store JWT in secure, httpOnly cookies (preferred)
- Or localStorage with XSS protection
- Always use HTTPS in production
- Implement token rotation
- Clear token on logout

### API Security
- Enable CORS with whitelist
- Implement rate limiting (100 requests/15 min)
- Validate all inputs
- Sanitize output
- Use HTTPS/TLS
- Implement API key for service-to-service communication

### Database Security
- Never expose connection strings
- Use connection pooling
- Encrypt sensitive data
- Implement field-level encryption for PII
- Regular backups

### Infrastructure Security
- Use environment variables for secrets
- Implement network policies
- Use VPC and private subnets
- Implement WAF (Web Application Firewall)
- Regular security audits
- Keep dependencies updated

---

## CORS Configuration

```javascript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://app.example.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
};

app.use(cors(corsOptions));
```

---

## Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

// Apply to all requests
app.use(limiter);

// Apply to sensitive endpoints
app.post('/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5 // Only 5 login attempts per 15 mins
}), controller.login);
```

---

## Security Headers

```javascript
app.use(helmet());

// Additional headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

---

## Incident Response

### Security Incident Checklist
- [ ] Identify the vulnerability
- [ ] Patch/fix the issue
- [ ] Verify the fix
- [ ] Audit logs for exploitation
- [ ] Notify affected users
- [ ] Update documentation
- [ ] Post-incident review

### Reporting Security Issues
Report security vulnerabilities to: security@example.com
Do not disclose publicly until fix is released.
