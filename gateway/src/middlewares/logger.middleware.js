export const loggerMiddleware = (req, res, next) => {
  console.log(`[GATEWAY ${req.id}] ${req.method} ${req.originalUrl}`);
  next();
};