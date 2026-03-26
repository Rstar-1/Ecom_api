import * as authService from "../../services/login/LoginService.js";

// 🔥 Common response helper
const send = (res, status, success, message, data) =>
  res.status(status).json({
    success,
    message,
    ...(data && { data }),
  });

// 🔥 Async wrapper (removes try-catch everywhere)
const asyncHandler = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((err) =>
    send(res, err.status || 500, false, err.message),
  );

// ================= CONTROLLERS =================

export const getUsers = asyncHandler(async (req, res) => {
  const result = await authService.getUsers(req.query);

  res.status(200).json({
    success: true,
    message: "Users fetched successfully",
    ...result,
  });
});

export const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req);
  send(res, 201, true, "Registered", data);
});

export const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  send(res, 200, true, "Login success", data);
});

export const logout = asyncHandler(async (req, res) => {
  const { message } = await authService.logout(req.user);
  send(res, 200, true, message);
});

export const updateUser = asyncHandler(async (req, res) => {
  const data = await authService.updateUser(req.params.id, req.body);
  send(res, 200, true, "Updated", data);
});
