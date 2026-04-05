import express from "express";
import { criarPedidoPix } from "./pagbank.js";
import { createOrderWithCreditCard } from "./pagbankChargeService.js";


const router = express.Router();

// PIX
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
    console.error("❌ ERRO PIX:", error.message);
   res.status(500).json({ error: "Erro ao processar pagamento" });
  }
});

router.post("/credit-card/create", async (req, res) => {
  try {
    const { encryptedCard } = req.body;

    if (!encryptedCard) {
      return res.status(400).json({ error: "Cartão criptografado não informado" });
    }

    const result = await createOrderWithCreditCard({ encryptedCard });

    res.status(201).json(result);

  } catch (err) {
    console.error("❌ ERRO PAGBANK:", err.response?.data || err.message);
    res.status(500).json(err.response?.data || { error: "Erro no pagamento" });
  }
});
router.post("/webhook/pagbank", (req, res) => {
  console.log("📩 WEBHOOK PAGBANK:", req.body);

  res.status(200).json({ received: true });
});


router.post("api/calcular-frete", async (req, res) => {
  try {
    const { cep } = req.body;

    if (!cep) {
      return res.status(400).json({ error: "CEP é obrigatório" });
    }

    const cepLimpo = cep.replace(/\D/g, "");

    // mock por enquanto
    const valorFrete = 15;

    res.json({ valor: valorFrete, cep: cepLimpo });

  } catch (error) {
    res.status(500).json({ error: "Erro ao calcular frete" });
  }
});





export default router;