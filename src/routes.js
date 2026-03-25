import express from "express";
import { criarPedidoPix } from "./pagbank.js";
import { createOrderWithCreditCard } from "./pagbankChargeService.js";


const router = express.Router();

// PIX
router.post("/pix/create", async (req, res) => {
  try {
    const { cart } = req.body;
    const result = await criarPedidoPix(cart);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
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


export default router;