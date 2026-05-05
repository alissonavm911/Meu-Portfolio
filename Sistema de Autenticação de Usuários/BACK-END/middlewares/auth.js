import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET;

const auth = (req, res, next) => {
  const token = req.headers.authorization;

if (!token) {
  return res.status(401).json({ mensagem: "Usuário não autorizado!" });
}

const authHeader = token.replace("Bearer", "").trim()

  try {
    const decoded = jwt.verify( authHeader, JWT_SECRET);
    req.user = decoded

    next();
  } catch (error) {
    return res.status(401).json({ mensagem: "Token inválido!" });
  }
};
export default auth;
