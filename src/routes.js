import express from "express";
import { criarPedidoPix } from "./pagbank.js";
import { createOrderWithCreditCard } from "./pagbankChargeService.js";

const router = express.Router();

/**
 * ===============================
 * PIX
 * ===============================
 */
router.post("/pix/create", async (req, res) => {
  try {
    const { cart, frete, cep } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Carrinho inválido" });
    }

    const freteSeguro = Number(frete) || 0;
    const cepLimpo = cep ? cep.replace(/\D/g, "") : "01001000";

    const result = await criarPedidoPix(cart, freteSeguro, cepLimpo);

    res.status(201).json(result);

  } catch (error) {
    console.error("❌ ERRO PIX:", error);
    res.status(500).json({
      error: error.message,
      detalhe: error.response?.data || null
    });
  }
});

/**
 * ===============================
 * CARTÃO
 * ===============================
 */
router.post("/credit-card/create", async (req, res) => {
  try {
    const { encryptedCard } = req.body;

    if (!encryptedCard) {
      return res.status(400).json({
        error: "Cartão criptografado não informado"
      });
    }

    const result = await createOrderWithCreditCard({ encryptedCard });

    res.status(201).json(result);

  } catch (err) {
    console.error("❌ ERRO PAGBANK:", err);
    res.status(500).json({
      error: "Erro no pagamento"
    });
  }
});

/**
 * ===============================
 * WEBHOOK
 * ===============================
 */
router.post("/webhook/pagbank", (req, res) => {
  console.log("📩 WEBHOOK PAGBANK:", req.body);
  res.status(200).json({ received: true });
});

/**
 * ===============================
 * FRETE
 * ===============================
 */
router.post("/calcular-frete", async (req, res) => {
  try {
    const { cep } = req.body;

    if (!cep) {
      return res.status(400).json({ error: "CEP é obrigatório" });
    }

    const cepLimpo = cep.replace(/\D/g, "");
    const cepNum = Number(cepLimpo);

    let valorFrete = 55; // padrão

    // Praia Grande
    if (cepNum >= 11700000 && cepNum <= 11729999) {
      valorFrete = 7;
    }

    // São Vicente, Mongaguá, Cubatão
    else if (
      (cepNum >= 11300000 && cepNum <= 11399999) ||
      (cepNum >= 11730000 && cepNum <= 11739999) ||
      (cepNum >= 11500000 && cepNum <= 11599999)
    ) {
      valorFrete = 15;
    }

    // Santos, Itanhaém
    else if (
      (cepNum >= 11000000 && cepNum <= 11099999) ||
      (cepNum >= 11740000 && cepNum <= 11749999)
    ) {
      valorFrete = 20;
    }

    // Baixada Santista
    else if (cepNum >= 11000000 && cepNum <= 11999999) {
      valorFrete = 30;
    }

    // Capital
    else if (cepNum >= 1000000 && cepNum <= 5999999) {
      valorFrete = 30;
    }

    // Interior SP
    else if (cepNum >= 10000000 && cepNum <= 19999999) {
      valorFrete = 40;
    }

    res.json({ valor: valorFrete, cep: cepLimpo });

  } catch (error) {
    console.error("❌ ERRO FRETE:", error);
    res.status(500).json({ error: "Erro ao calcular frete" });
  }
});

export default router;
