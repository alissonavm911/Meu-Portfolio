import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET;

const adminOnly = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ mensagem: "Usuário não autorizado!" });
  }

  const decoded = jwt.verify(token.replace("Bearer", "").trim(), JWT_SECRET);

  if (decoded.user || decoded.admin) {
    return next();
  } else {
    return res.status(403).json({ mensagem: "Acesso negado: apenas admins" });
  };
};

export default adminOnly;
