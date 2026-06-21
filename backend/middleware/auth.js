const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Verifies the JWT and attaches { id } to req.user.
 *
 * Design decision: the token is read from an httpOnly cookie rather than
 * a manually-attached "Authorization: Bearer <token>" header read from
 * localStorage. Storing JWTs in localStorage exposes them to theft via any
 * XSS in the page (any injected script can read localStorage and exfiltrate
 * the token). An httpOnly cookie is invisible to JavaScript entirely, which
 * closes that attack surface. The trade-off is that we must configure CORS
 * with credentials + a strict SameSite policy and guard against CSRF
 * (mitigated here via SameSite=Lax/Strict and same-origin-only deployment).
 */
const protect = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    throw new ApiError(401, 'Access denied. Missing or expired session.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (_err) {
    throw new ApiError(401, 'Invalid or expired session token.');
  }
});

module.exports = protect;
