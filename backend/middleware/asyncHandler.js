// Express 4 ne transmet pas les erreurs des handlers async au middleware
// d'erreur : ce wrapper attrape les rejets de promesses et appelle next(err).
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { asyncHandler };
