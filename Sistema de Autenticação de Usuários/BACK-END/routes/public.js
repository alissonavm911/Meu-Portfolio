// Configurações
import express from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
router.use(express.json());

// CADASTRO
router.post("/cadastro", async (req, res) => {
  try {
    const user = req.body;

    if (!user.email || !user.password || !user.name) {
      return res.status(400).json({
        mensagem: "Email, nome e senha são obrigatórios!",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(user.password, salt);

    const userDB = await prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        password: hashPassword,
      },
    });

    res.status(201).json({
      mensagem: "Usuário criado com sucesso!"
    });
  } catch (erro) {
    if (erro.code === "P2002") {
      return res.status(400).json({
        mensagem: "Esse email já está cadastrado!",
      });
    }

    res.status(500).json({ mensagem: "Erro no servidor!" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const userInfo = req.body;

    if (!userInfo.email || !userInfo.password) {
      return res.status(400).json({
        mensagem: "Usuário não encontrado!"
      })
    }

    const user = await prisma.user.findUnique({
      where: { email: userInfo.email },
    });

    if (!user) {
      return res.status(404).json({ mensagem: "Usuário não encontrado!" });
    }

    const isMatch = await bcrypt.compare(userInfo.password, user.password);

    if (!isMatch) {
      return res.status(400).json({ mensagem: "Senha inválida!" });
    }

    const token = jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      admin: user.admin
      },
      JWT_SECRET,
      { expiresIn: "10m" },
    );

    const refreshToken = jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      admin: user.admin 
      },
      REFRESH_SECRET,
      { expiresIn: "1d" },
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshToken },
    });

    res.status(200).json({ token, refreshToken });
  } catch (erro) {
    res.status(500).json({ mensagem: "Erro no servidor!" });
  }
});

// REFRESH TOKEN
router.post("/refresh", async (req, res) => {
  const { refreshToken: oldToken } = req.body;

  if (!oldToken) {
    return res.status(401).json({ mensagem: "Refresh token obrigatório" });
  }

  try {
    const payload = jwt.verify(oldToken, REFRESH_SECRET);

    if (typeof payload === "string") {
      return res.status(403).json({ mensagem: "Token inválido" });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user) {
      return res.status(404).json({
        mensagem: "Usuário não encontrado",
      });
    }

    if (user.refreshToken !== oldToken) {
      return res.status(403).json({
        mensagem: "Token já utilizado ou inválido!",
      });
    }

    const newToken = jwt.sign({ 
      id: user.id, 
      email: user.email, 
      name: user.name, admin: 
      user.admin 
      },
      JWT_SECRET,
      { expiresIn: "10m" },
    );

    const newRefreshToken = jwt.sign({ 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      admin: user.admin 
      },
      REFRESH_SECRET,
      { expiresIn: "1d" },
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    res.json({
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    return res.status(403).json({ mensagem: "Refresh token inválido" });
  }
});

export default router;
