export const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    // If session is expired or not present, redirect to login
    return res
      .status(401)
      .send({ message: "Session expired. Please log in again." });
  }
  next(); // Proceed if the user is authenticated
};
