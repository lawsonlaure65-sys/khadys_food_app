
import { createClient } from '@supabase/supabase-js';
import { MenuItem, Order } from '../types';

const rawUrl = ((import.meta as any).env?.VITE_SUPABASE_URL || '').trim();

// Extraction automatique de l'origine exacte (ex: https://xxxx.supabase.co)
function sanitizeSupabaseUrl(urlStr: string): string {
  if (!urlStr) return '';
  try {
    const formatted = urlStr.startsWith('http') ? urlStr : `https://${urlStr}`;
    const parsed = new URL(formatted);
    return parsed.origin;
  } catch {
    return urlStr.replace(/\/+$/, '').replace(/\/(rest|ret)\/v1\/?$/i, '');
  }
}

const cleanUrl = sanitizeSupabaseUrl(rawUrl);
const supabaseKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = 
  cleanUrl.startsWith('https://') && 
  !cleanUrl.includes('votre-projet') &&
  !cleanUrl.includes('your-project') &&
  supabaseKey.length > 20;

export const supabase = isSupabaseConfigured 
  ? createClient(cleanUrl, supabaseKey) 
  : null;

/**
 * SERVICE DE DONNÉES KHADY'S ELITE
 * Gère la synchronisation entre l'App et le Cloud
 */
export const db = {
  // --- MENU ---
  fetchMenu: async (): Promise<MenuItem[] | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('category', { ascending: true });
    if (error) {
      console.warn("Table menu_items non accessible ou vide sur Supabase:", error.message);
      return null;
    }
    if (!data) return null;
    return data.map((item: any) => ({
      id: item.id,
      name: item.name || '',
      description: item.description || '',
      price: Number(item.price) || 0,
      image: item.image || '',
      category: item.category || 'Plat Africain',
      rating: Number(item.rating) || 5,
      isAvailable: item.is_available ?? true,
      isSpicy: item.is_spicy ?? false,
      isSpécialitéMaison: item.is_specialite_maison ?? false,
      isPlatDuJour: item.is_plat_du_jour ?? false,
    })) as MenuItem[];
  },

  saveMenuItem: async (item: MenuItem) => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('menu_items')
      .upsert({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image,
        category: item.category,
        rating: item.rating,
        is_available: item.isAvailable,
        is_spicy: item.isSpicy,
        is_specialite_maison: item.isSpécialitéMaison
      })
      .select();
    if (error) throw error;
    return data;
  },

  deleteMenuItem: async (id: string) => {
    if (!supabase) return null;
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) throw error;
  },

  // --- COMMANDES ---
  fetchOrders: async (): Promise<Order[] | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('timestamp', { ascending: false });
    if (error) {
      console.warn("Table orders non accessible ou vide sur Supabase:", error.message);
      return null;
    }
    if (!data) return null;
    return data.map((o: any) => ({
      id: o.id,
      customerName: o.customer_name || 'Client',
      phone: o.phone || '',
      address: o.address || '',
      district: o.district || '',
      items: typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []),
      total: Number(o.total) || 0,
      deliveryFee: Number(o.delivery_fee) || 0,
      status: o.status || 'RECEIVED',
      paymentMethod: o.payment_method || 'CASH',
      paymentType: o.payment_type,
      paymentTransactionId: o.payment_transaction_id,
      paymentProofUrl: o.payment_proof_url,
      paymentValidated: o.payment_validated,
      timestamp: o.timestamp || new Date().toISOString()
    })) as Order[];
  },

  placeOrder: async (order: Order) => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('orders')
      .insert({
        id: order.id,
        customer_name: order.customerName,
        phone: order.phone,
        items: order.items,
        total: order.total,
        delivery_fee: order.deliveryFee,
        status: order.status,
        payment_method: order.paymentMethod,
        payment_type: order.paymentType,
        payment_transaction_id: order.paymentTransactionId,
        payment_proof_url: order.paymentProofUrl,
        payment_validated: order.paymentValidated ?? false,
        timestamp: order.timestamp,
        district: order.district,
        address: order.address
      })
      .select();
    if (error) {
      console.warn("Erreur insertion commande Supabase:", error.message);
    }
    return data;
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    if (!supabase) return null;
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    if (error) throw error;
  }
};
