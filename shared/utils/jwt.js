import jsonwebtoken from "jsonwebtoken";

const generateToken = (payload, secret, expiresIn = "1d") => {
  return jsonwebtoken.sign(payload, secret, {
    expiresIn,
  });
};

const verifyToken = (token, secret) => {
  try {
    return jsonwebtoken.verify(token, secret);
  } catch (err) {
    return null;
  }
};

export default {
  generateToken,
  verifyToken,
};
