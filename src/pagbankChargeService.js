import axios from "axios";
import dotenv from "dotenv";
import { auditPagBankRequest, auditPagBankResponse } from "./pagbankLogger.js";
import { auditPagBankError } from "./pagbankLogger.js";
import {criarPedidoPix} from "./pagbank.js"

dotenv.config();
export async function createOrderWithCreditCard({
  encryptedCard,
  cart,
  frete = 0,
  cep = "01001000"
}) {

  cep = cep.replace(/\D/g, "");

  const totalProdutos = cart.reduce(
    (acc, item) => acc + item.preco * item.quantidade,
    0
  );

  const total = totalProdutos + frete;

  const payload = {
    reference_id: "pedido_cartao_" + Date.now(),
    notification_urls: [process.env.PAGBANK_WEBHOOK_URL],

    customer: {
      name: "Arthur_Barbosa",
      email: "arthur.shekinarfoxy@gmail.com",
      tax_id: "52517479852"
    },

    shipping: {
      amount: {
        value: Math.round(frete * 100)
      },
      address: {
        street: "Rua Exemplo",
        number: "123",
        locality: "Centro",
        city: "São Paulo",
        region_code: "SP",
        country: "BRA",
        postal_code: cep
      }
    },

    items: cart.map(item => ({
      name: item.titulo,
      quantity: item.quantidade,
      unit_amount: Math.round(item.preco * 100)
    })),

    charges: [
      {
        reference_id: "charge_" + Date.now(),
        description: "Pagamento com cartão",

        amount: {
          value: Math.round(total * 100),
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
              street: "Rua Exemplo",
              number: "123",
              locality: "Centro",
              city: "São Paulo",
              region_code: "SP",
              country: "BRA",
              postal_code: cep
            }
          }
        }
      }
    ]
  };

  return await criarPedidoPix(payload);
}

