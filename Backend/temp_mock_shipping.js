// Temporary script to bypass RajaOngkir rate limit
// This will make backend stable for payment testing

const db = require('./config/database');

async function mockShippingCosts() {
  console.log('Setting up mock shipping data...');
  
  // Update all cart shipping dengan data mock
  const [carts] = await db.query(`
    SELECT c.cart_id, c.user_id 
    FROM carts c 
    WHERE c.selected_shipping_service IS NULL OR c.selected_shipping_service = ''
  `);

  for (const cart of carts) {
    await db.query(`
      UPDATE carts 
      SET selected_shipping_service = ?, 
          selected_shipping_cost = ?,
          selected_shipping_courier = ?
      WHERE cart_id = ?
    `, ['REG', 10000, 'jne', cart.cart_id]);
  }

  console.log(`Updated ${carts.length} carts with mock shipping`);
  process.exit(0);
}

mockShippingCosts().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
