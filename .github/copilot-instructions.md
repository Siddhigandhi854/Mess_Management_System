# Copilot Instructions: Mess Management System

## Architecture Overview

**Tech Stack**: Node.js/Express + EJS + MongoDB + JWT + Tailwind CSS  
**Pattern**: MVC with role-based access control  
**Key Files**: [app.js](../app.js) (Express setup), [config/db.js](../config/db.js) (MongoDB)

The app uses a **direct MongoDB connection in app.js** (hardcoded Atlas URI) rather than the modular db.js config module—don't refactor this without updating the connection logic. Three roles exist: **student**, **messKaki** (mess staff), **admin**, stored in User model and enforced via middleware.

### Data Flow Patterns
- **Authentication**: Cookie-based JWT tokens set during login. Token decoded in [authMiddleware.js](../middlewares/authMiddleware.js) on every request.
- **Authorization**: Role-based middleware in [roleMiddleware.js](../middlewares/roleMiddleware.js) uses variadic pattern: `roleMiddleware("student", "messKaki")` returns middleware that renders 403 page.
- **View Locals**: User/role injected into res.locals in [app.js](../app.js) line 37—always available in EJS templates as `currentUser` and `role`.

### Model Relationships
- **Attendance**: Links `student` (User ref) + date (unique index on student+date)
- **Payment**: Student + month/year billing cycle with paid/unpaid status
- **Menu**: Weekday-based repeating entries with meal types (breakfast/lunch/dinner)
- **Complaint, MessOff, FoodQuantityConfig**: Reference User or independent configs

## Critical Developer Workflows

### Local Development
```bash
npm install  # Install dependencies (nodemon in devDependencies)
npm run dev  # Runs nodemon app.js—watches for file changes
```
No test suite or build process exists. Server runs directly.

### Database Connection
- Production: Atlas URI hardcoded in [app.js](../app.js) line 19 (SECURITY CONCERN—should use env var)
- Environment: `.env` file must contain `JWT_SECRET` and `PORT` (see authMiddleware.js)

### Adding New Routes
1. Create controller in [controllers/](../controllers/) following existing pattern (exports named functions)
2. Create route file in [routes/](../routes/) using `authMiddleware` + `roleMiddleware` guards
3. Mount in [app.js](../app.js) before 404 handler
4. Example: POST route in [authRoutes.js](../routes/authRoutes.js) uses controller method, renders form on GET/error on POST failure

## Project-Specific Conventions

### Password Hashing
User schema uses Mongoose pre-save hook with bcryptjs. **Always** rely on `user.comparePassword(candidatePassword)` method—never use plain comparison.

### Token Generation
JWT payload includes `id`, `role`, `email` with 7-day expiry. Decode in [authMiddleware.js](../middlewares/authMiddleware.js)—extract role to check in roleMiddleware.

### EJS View Structure
- **Layouts**: [layout.ejs](../views/layout.ejs) wraps content, includes [_header.ejs](../views/_header.ejs) + [_footer.ejs](../views/_footer.ejs)
- **Role-based views**: `/admin/`, `/student/`, `/mess/` folders organize by role
- **Template variables**: Pass `title`, `currentUser`, `role` from controllers; use `res.locals` in middleware

### Error Handling
- Forms re-render with `error` object on validation failure (see [authController.js](../controllers/authController.js) lines 48-50)
- 404 page at [views/404.ejs](../views/404.ejs) rendered by 404 handler
- 403 page at [views/403.ejs](../views/403.ejs) rendered by roleMiddleware on insufficient permissions

### Middleware Chain Order
Auth flow: `authMiddleware` → `roleMiddleware` → controller. Unauthenticated requests redirect to `/auth/login`. Failed role check renders 403.

## Integration Points & Dependencies

| Package | Purpose | Key Files |
|---------|---------|-----------|
| **mongoose** | MongoDB ODM | [models/\*](../models/), connection in [app.js](../app.js) |
| **jsonwebtoken** | JWT signing/verification | [authController.js](../controllers/authController.js), [authMiddleware.js](../middlewares/authMiddleware.js) |
| **bcryptjs** | Password hashing | [User.js](../models/User.js) pre-save hook, comparePassword method |
| **ejs** | View engine | [views/\*](../views/) |
| **express** | Web framework | [app.js](../app.js), [routes/\*](../routes/) |
| **cookie-parser** | JWT from cookies | [app.js](../app.js), authMiddleware reads `req.cookies.token` |

**External API/Services**: None currently—standalone system. MongoDB is the only external dependency.

## Non-Obvious Patterns

1. **Lean queries**: Some queries use `.lean()` (e.g., [authMiddleware.js](../middlewares/authMiddleware.js) line 11) for read-only queries to skip Mongoose overhead.
2. **methodOverride**: [app.js](../app.js) uses `method-override` to simulate HTTP verbs (PUT/DELETE) via POST `_method` param for EJS forms.
3. **Unique email enforcement**: User model has `unique: true` on email + `lowercase` + `trim`—handle duplicate errors in controller, not middleware.
4. **morgan logging**: `morgan("dev")` in [app.js](../app.js) logs all requests—visible in console during development.

## Testing & Debugging Notes

- No test files or test runner configured
- Use `npm run dev` to start with nodemon for auto-reload during development
- JWT token stored in cookies; inspect via browser DevTools → Application → Cookies
- Check MongoDB Atlas connection/status if 500 errors occur during startup
