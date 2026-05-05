// ======================= Configurações =======================
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import adminOnly from "../middlewares/adminOnly.js";
import auth from "../middlewares/auth.js";

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
router.use(express.json());

// ======================= Verifica o Token =======================

router.get("/perfil", auth, async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ mensagem: "Token não fornecido!" });
    }

    const tokenInfo = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: tokenInfo.id },
      select: {
        id: true,
        name: true,
        email: true,
        admin: true,
      },
    });

    if (!user) {
      return res.status(404).json({ mensagem: "Usuário não encontrado!" });
    }

    return res.status(200).json(user);
  } catch (erro) {
    return res.status(403).json({ mensagem: "Token inválido ou expirado!" });
  }
});

// ======================= ADMIN =======================

router.get("/admin", auth, adminOnly, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        admin: true,
        name: true,
        email: true,
        id: true,
      },
    });

    res.status(200).json(users);
  } catch (erro) {
    res.status(500).json({ mensagem: "Erro no servidor!" });
  }
});

router.put("/users/put/:email", auth, adminOnly, async (req, res) => {
  const { email } = req.params;
  const { nome, admin } = req.body;

  try {
    const putUser = await prisma.user.update({
      where: {
        email: email,
      },
      data: {
        name: nome,
        admin: admin,
      },
    });

    res.status(200).json(putUser);
  } catch (erro) {
    console.error("Erro Prisma:", erro);
    res.status(500).json({ mensagem: "Erro ao atualizar usuário no banco!" });
  }
});

router.delete("/users/delete/:email", auth, adminOnly, async (req, res) => {
  try {
    const { email } = req.params;
    const userDeleted = await prisma.user.delete({
      where: { email: email },
    });

    res.status(200).json(userDeleted);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao apagar o usuário no banco!" });
  }
});

// ======================= USUÁRIOS =======================

router.get("/users", auth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        name: true,
        email: true,
        admin: true,
        id: true,
      },
    });

    res.status(200).json(users);
  } catch (erro) {
    res.status(500).json({ mensagem: "Erro no servidor!" });
  }
});

export default router;
