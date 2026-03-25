import dotenv from "dotenv";
dotenv.config();
import { createOrderWithCreditCard } from "./pagbankChargeService.js";
import axios from "axios";
import crypto from "crypto";
import {
  auditPagBankRequest,
  auditPagBankResponse,
  auditPagBankError
} from "./pagbankLogger.js";

const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN?.trim();

if (!PAGBANK_TOKEN) {
  throw new Error("PAGBANK_TOKEN não definido");
}

const PAGBANK_API = "https://api.pagseguro.com";
/**
 * Envia pedido para o PagBank (Sandbox)
 * Autenticação via AppKey (Bearer Token)
 */
async function enviarPedidoPagBank(payload) {
  const requestId = crypto.randomUUID();

  const headers = {
    Authorization: `Bearer ${PAGBANK_TOKEN}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "PagBank-Node-Client"
  };

  auditPagBankRequest({
    requestId,
    url: `${PAGBANK_API}/orders`,
    headers,
    payload
  });

  try {
    const response = await axios.post(
  `${PAGBANK_API}/orders`,
  payload,
  { headers, timeout: 10000 }
);

if (response.status >= 400) {
  throw new Error(JSON.stringify(response.data));
}

    auditPagBankResponse({
      requestId,
      status: response.status,
      data: response.data
    });

    return response.data;
  } catch (error) {
    auditPagBankError({ requestId, error });
    throw error;
  }
}

/* =========================
   PIX
========================= */

export async function criarPedidoPix(cart) {
  const total = cart.reduce(
    (acc, item) => acc + item.preco * item.quantidade,
    0
  );

  const payload = {
    reference_id: "pedido_pix_" + Date.now(),
    notification_urls: [process.env.PAGBANK_WEBHOOK_URL],

    customer: {
      name: "Arthur_Barbosa",
      email: "arthur.shekinarfoxy@gmail.com",
      tax_id: "52517479852"
    },

    items: cart.map(item => ({
      name: item.titulo,
      quantity: item.quantidade,
      unit_amount: Math.round(item.preco * 100)
    })),

    qr_codes: [
      {
        amount: {
          value: Math.round(total * 100)
        }
      }
    ]
  };

  const order = await enviarPedidoPagBank(payload);

  const qrCode = order.qr_codes?.[0];
  if (!qrCode?.text) {
    throw new Error("PIX Copia e Cola não retornado");
  }

  return {
    orderId: order.id,
    status: order.status,
    pixCopiaCola: qrCode.text,
    qrCodeLink:
      qrCode.links?.find(l => l.rel === "QRCODE")?.href || null
  };
}


export async function createCreditCard(req, res) {
  try {
    const { encryptedCard } = req.body;

    if (!encryptedCard) {
      return res.status(400).json({ error: "Cartão criptografado não informado" });
    }

   const result = await createOrderWithCreditCard({ encryptedCard });

    res.json(result);

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(error.response?.data || { error: "Erro interno" });
  }
}


