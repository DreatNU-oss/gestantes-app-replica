/**
 * Script para criar o produto e preço no Stripe para o módulo WhatsApp
 * Executar uma única vez: node scripts/setup-stripe-product.mjs
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
dotenv.config();

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function main() {
  console.log('🔧 Configurando produto e preço no Stripe...');
  console.log('Usando chave:', process.env.STRIPE_SECRET_KEY?.substring(0, 20) + '...');

  // Verificar se já existe um produto com o mesmo nome
  const existingProducts = await stripe.products.list({ limit: 100 });
  const existing = existingProducts.data.find(p => p.name === 'WhatsApp Obstétrico - Por Obstetra');

  let product;
  if (existing) {
    console.log('✅ Produto já existe:', existing.id);
    product = existing;
  } else {
    // Criar produto
    product = await stripe.products.create({
      name: 'WhatsApp Obstétrico - Por Obstetra',
      description: 'Acesso ao módulo de mensagens WhatsApp para obstetras. Cobrança mensal por obstetra ativo.',
      metadata: {
        modulo: 'whatsapp',
        sistema: 'gestantesapp',
      },
    });
    console.log('✅ Produto criado:', product.id);
  }

  // Verificar se já existe preço para este produto
  const existingPrices = await stripe.prices.list({ product: product.id, limit: 10 });
  const existingPrice = existingPrices.data.find(p => p.unit_amount === 4990 && p.currency === 'brl' && p.recurring?.interval === 'month');

  let price;
  if (existingPrice) {
    console.log('✅ Preço já existe:', existingPrice.id);
    price = existingPrice;
  } else {
    // Criar preço: R$ 49,90/mês por obstetra
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: 4990, // R$ 49,90 em centavos
      currency: 'brl',
      recurring: {
        interval: 'month',
      },
      nickname: 'Mensal por Obstetra - R$ 49,90',
      metadata: {
        modulo: 'whatsapp',
      },
    });
    console.log('✅ Preço criado:', price.id);
  }

  console.log('\n📋 CONFIGURAÇÃO CONCLUÍDA:');
  console.log('   Product ID:', product.id);
  console.log('   Price ID:', price.id);
  console.log('   Valor: R$ 49,90/mês por obstetra');
  console.log('\n⚠️  SALVE ESSES IDs - serão necessários no código:');
  console.log(`   STRIPE_WHATSAPP_PRODUCT_ID=${product.id}`);
  console.log(`   STRIPE_WHATSAPP_PRICE_ID=${price.id}`);
}

main().catch(console.error);
