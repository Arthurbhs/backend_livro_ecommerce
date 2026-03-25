import axios from "axios";
import dotenv from "dotenv";
import { auditPagBankRequest, auditPagBankResponse } from "./pagbankLogger.js";
import { auditPagBankError } from "./pagbankLogger.js";

dotenv.config();
export async function createOrderWithCreditCard({ encryptedCard }) {
  const payload = {
    reference_id: "order_" + Date.now(),

    customer: {
      name: "Arthur_Barbosa",
      email: "arthur.shekinarfoxy@gmail.com",
      tax_id: "52517479852"
    },

    items: [
      {
        name: "Produto Teste",
        quantity: 1,
        unit_amount: 1000
      }
    ],

    charges: [
      {
        reference_id: "charge_" + Date.now(),
        description: "Pagamento com cartão",

        amount: {
          value: 1000,
          currency: "BRL"
        },

        payment_method: {
          type: "CREDIT_CARD",
          installments: 1,
          capture: true,
          soft_descriptor: "MINHALOJA",

          card: {
            encrypted: encryptedCard,
            holder: {
              name: "Arthur_Barbosa"
            },

            billing_address: {
              street: "Rua Teste",
              number: "123",
              locality: "Centro",
              city: "São Paulo",
              region_code: "SP",
              country: "BRA",
              postal_code: "01001000"
            }
          }
        }
      }
    ],

    notification_urls: [process.env.PAGBANK_WEBHOOK_URL]
  };

  try {
    auditPagBankRequest({
      endpoint: "/orders",
      payload
    });

    const response = await axios.post(
      "https://api.pagseguro.com/orders",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAGBANK_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    auditPagBankResponse({
      endpoint: "/orders",
      response: response.data
    });

    return response.data;

  } catch (error) {
    auditPagBankError({
      endpoint: "/orders",
      error: error.response?.data || error.message
    });

    throw error;
  }
}

