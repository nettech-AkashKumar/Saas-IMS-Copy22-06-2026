import api from '../pages/config/axiosInstance';

export const getTotalStockValue = async () => {
  try {
    const res = await api.get('/api/products/stock', {
      params: { limit: 1000000 },
    });
    // If response is paginated, use res.data.products, else res.data
    const products = res.data.products || res.data;
    const totalValue = products.reduce((acc, product) => {
      // If stockValue is present, use it. Otherwise, calculate quantity * sellingPrice
      if (typeof product.stockValue === 'number' && !isNaN(product.stockValue)) {
        return acc + product.stockValue;
      } else {
        const qty = Number(product.quantity) || 0;
        const price = Number(product.sellingPrice) || 0;
        return acc + (qty * price);
      }
    }, 0);
    return totalValue;
  } catch (err) {
    return 0;
  }
};