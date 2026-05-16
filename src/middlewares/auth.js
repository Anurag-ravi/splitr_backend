const { verifyToken } = require("../utilities/token");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers["authorization"];

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const result = await verifyToken(token);

    if (!result.valid) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    req.user = result.user;

    next();
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports = { authMiddleware };
