export async function criarPedidoPix(cart, frete = 0, cep = "01001000") {

  cep = cep.replace(/\D/g, "");

  const totalProdutos = cart.reduce(
    (acc, item) => acc + item.preco * item.quantidade,
    0
  );

  const total = totalProdutos + frete;

  const payload = {
    reference_id: "pedido_pix_" + Date.now(),
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
    const { encryptedCard, cart, frete = 0, cep = "01001000" } = req.body;

    if (!encryptedCard) {
      return res.status(400).json({ error: "Cartão criptografado não informado" });
    }

    const result = await createOrderWithCreditCard({
      encryptedCard,
      cart,
      frete,
      cep
    });

    res.json(result);

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(error.response?.data || { error: "Erro interno" });
  }
}