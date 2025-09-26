export const adminAuth = (req, res, next) => {
  const user = req.session?.user;
  if (!user) return res.status(401).send({ message: "Not logged in" });
  if (!user.isAdmin) return res.status(403).send({ message: "Admin access required" });
  next();
};
