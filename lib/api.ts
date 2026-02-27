import { supabase } from './supabaseClient'

// Types
export interface OverallStats {
  instapay_total: number
  cash_total: number
  total_collected: number
  total_owed: number
  remaining_balance: number
}

export interface UserFinancials {
  username: string
  instapay_total: number
  cash_total: number
  total_collected: number
  total_paid_to_suppliers: number
  user_balance: number
}

export interface SupplierBalance {
  supplier_id: string
  name: string
  owed_total: number
  paid_total: number
  remaining_to_pay: number
}

export interface Supplier {
  id: string
  name: string
  meal_unit_price: number
  transportation_fee: number
}

export interface CashEntry {
  amount: number
  note?: string
}

export interface InstapayItem {
  amount: number
  image_url: string
}

export interface SupplierPayment {
  supplier_id: string
  paid_by_username: string
  method: 'instapay' | 'cash'
  amount: number
  note?: string
  image_url?: string
}

export interface MealOrder {
  order_date: string
  supplier_id: string
  meals_count: number
  unit_price_snapshot: number
  transportation_fee_snapshot?: number
}

export interface MealOrderLog {
  order_date: string
  meals_count: number
  supplier_name: string
}

// View queries
export async function getOverall(): Promise<OverallStats | null> {
  const { data, error } = await supabase
    .from('v_overall')
    .select('*')
    .single()

  if (error) {
    console.error('Error fetching overall stats:', error)
    return null
  }
  return data
}

export async function getSupplierBalanceById(supplierId: string) {
  const { data, error } = await supabase
      .from('v_supplier_balance')
      .select('*')
      .eq('supplier_id', supplierId)
      .single()

  if (error) {
    console.error('Error fetching supplier balance:', error)
    return null
  }
  return data
}

export interface SupplierPaymentLog {
  payment_date: string // date
  payment_datetime: string // timestamp
  supplier_name: string
  supplier_id: string
  paid_by_username: string
  method: 'instapay' | 'cash'
  amount: number
  note?: string | null
  image_url?: string | null
}

export async function getPaymentsForSupplier(
    supplierName: string
): Promise<SupplierPaymentLog[]> {
  const { data, error } = await supabase
      .from('v_supplier_payments_log')
      .select('*')
      .eq('supplier_name', supplierName)
      .order('payment_datetime', { ascending: false })

  if (error) {
    console.error('Error fetching supplier payments:', error)
    return []
  }
  return data || []
}

export interface UserPaymentLog {
  id: string
  created_at: string
  amount: number
  method: 'instapay' | 'cash'
  supplier_id: string
  supplier_name: string
  note?: string | null
  image_url?: string | null
}

export async function getPaymentsMadeByUser(username: string): Promise<UserPaymentLog[]> {
  const { data, error } = await supabase
      .from('v_user_payments_log')
      .select('*')
      .eq('paid_by_username', username)
      .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user payments:', error)
    return []
  }

  return data || []
}

export async function getUserFinancials(): Promise<UserFinancials[]> {
  const { data, error } = await supabase.from('v_user_financials').select('*')

  if (error) {
    console.error('Error fetching user financials:', error)
    return []
  }
  return data || []
}

export async function getSupplierBalances(): Promise<SupplierBalance[]> {
  const { data, error } = await supabase.from('v_supplier_balance').select('*')

  if (error) {
    console.error('Error fetching supplier balances:', error)
    return []
  }
  return data || []
}

export async function getSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, name, meal_unit_price, transportation_fee')
    .neq('name', 'Transportation')

  if (error) {
    console.error('Error fetching suppliers:', error)
    return []
  }
  return data || []
}

// Profile operations
export async function checkUserExists(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking user:', error)
  }
  return !!data
}

export async function createUser(username: string): Promise<boolean> {
  const { error } = await supabase.from('profiles').insert([{ username }])

  if (error) {
    console.error('Error creating user:', error)
    return false
  }
  return true
}

// Cash entries
export async function addCashEntries(
  username: string,
  entries: CashEntry[]
): Promise<boolean> {
  const formattedEntries = entries.map((e) => ({
    username,
    amount: e.amount,
    note: e.note || null,
  }))

  const { error } = await supabase.from('cash_entries').insert(formattedEntries)

  if (error) {
    console.error('Error adding cash entries:', error)
    return false
  }
  return true
}

// Instapay entries
export async function addInstapayEntries(
  username: string,
  items: InstapayItem[]
): Promise<boolean> {
  const formattedItems = items.map((item) => ({
    username,
    amount: item.amount,
    image_url: item.image_url,
  }))

  const { error } = await supabase.from('instapay_entries').insert(formattedItems)

  if (error) {
    console.error('Error adding instapay entries:', error)
    return false
  }
  return true
}

// Supplier payments
export async function addSupplierPayment(payment: SupplierPayment): Promise<boolean> {
  const { error } = await supabase.from('supplier_payments').insert([
    {
      supplier_id: payment.supplier_id,
      paid_by_username: payment.paid_by_username,
      method: payment.method,
      amount: payment.amount,
      note: payment.note || null,
      image_url: payment.image_url || null,
    },
  ])

  if (error) {
    console.error('Error adding supplier payment:', error)
    return false
  }
  return true
}

// Meal orders
export async function upsertMealOrder(order: MealOrder): Promise<boolean> {
  const { error } = await supabase.from('meal_orders').upsert([
    {
      order_date: order.order_date,
      supplier_id: order.supplier_id,
      meals_count: order.meals_count,
      unit_price_snapshot: order.unit_price_snapshot,
      transportation_fee_snapshot: order.transportation_fee_snapshot || 0,
    },
  ])

  if (error) {
    console.error('Error upserting meal order:', error)
    return false
  }
  return true
}

// Update supplier defaults
export async function updateSupplierDefaults(
  supplierId: string,
  mealUnitPrice: number,
  transportationFee: number
): Promise<boolean> {
  const { error } = await supabase
    .from('suppliers')
    .update({
      meal_unit_price: mealUnitPrice,
      transportation_fee: transportationFee,
    })
    .eq('id', supplierId)

  if (error) {
    console.error('Error updating supplier defaults:', error)
    return false
  }
  return true
}

// Get instapay entries for a user
export async function getInstapayEntries(username: string) {
  const { data, error } = await supabase
    .from('instapay_entries')
    .select('*')
    .eq('username', username)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching instapay entries:', error)
    return []
  }
  return data || []
}

// Get cash entries for a user
export async function getCashEntries(username: string) {
  const { data, error } = await supabase
    .from('cash_entries')
    .select('*')
    .eq('username', username)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching cash entries:', error)
    return []
  }
  return data || []
}

// Get supplier by name
export async function getSupplierByName(name: string): Promise<Supplier | null> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('name', name)
    .single()

  if (error) {
    console.error('Error fetching supplier:', error)
    return null
  }
  return data
}

// Get meal orders for a supplier
export async function getMealOrdersForSupplier(
  supplierName: string
): Promise<MealOrderLog[]> {
  const { data, error } = await supabase
    .from('v_meal_orders_log')
    .select('*')
    .eq('supplier_name', supplierName)
    .order('order_date', { ascending: false })

  if (error) {
    console.error('Error fetching meal orders:', error)
    return []
  }
  return data || []
}

// Upload image to storage
export async function uploadImage(
  file: File,
  username: string
): Promise<string | null> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const random = Math.random().toString(36).substring(2, 10)
  const fileName = `${today}/${random}.jpg`
  const filePath = `${username}/${fileName}`

  const { error } = await supabase.storage.from('Instapay').upload(filePath, file)

  if (error) {
    console.error('Error uploading image:', error)
    return null
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('Instapay').getPublicUrl(filePath)

  return publicUrl
}

// Meal Orders Log types and functions
export interface MealOrdersLogEntry {
  id: string
  order_date: string
  supplier_id: string
  supplier_name: string
  meals_count: number
  unit_price_snapshot: number
  created_at: string
}

export interface MealOrdersLogFilters {
  supplier_id?: string | null
  date_from?: string
  date_to?: string
}

export async function getMealOrdersLog(
  filters?: MealOrdersLogFilters
): Promise<MealOrdersLogEntry[]> {
  let query = supabase
    .from('meal_orders')
    .select('id, order_date, supplier_id, meals_count, unit_price_snapshot, created_at')

  // Add supplier filter
  if (filters?.supplier_id) {
    query = query.eq('supplier_id', filters.supplier_id)
  }

  // Add date range filters
  if (filters?.date_from) {
    query = query.gte('order_date', filters.date_from)
  }
  if (filters?.date_to) {
    query = query.lte('order_date', filters.date_to)
  }

  // Sort by order_date desc, then created_at desc
  query = query.order('order_date', { ascending: false }).order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching meal orders log:', error)
    return []
  }

  // Get supplier names
  const uniqueSupplierIds = [...new Set((data || []).map((d) => d.supplier_id))]
  const { data: supplierData } = await supabase
    .from('suppliers')
    .select('id, name')
    .in('id', uniqueSupplierIds)

  const supplierMap = new Map(supplierData?.map((s) => [s.id, s.name]) || [])

  return (data || []).map((order) => ({
    ...order,
    supplier_name: supplierMap.get(order.supplier_id) || 'Unknown',
  }))
}

export async function updateMealOrder(
  id: string,
  payload: {
    meals_count?: number
    unit_price_snapshot?: number
  }
): Promise<boolean> {
  const updateData: any = {}
  if (payload.meals_count !== undefined) {
    updateData.meals_count = payload.meals_count
  }
  if (payload.unit_price_snapshot !== undefined) {
    updateData.unit_price_snapshot = payload.unit_price_snapshot
  }

  const { error } = await supabase.from('meal_orders').update(updateData).eq('id', id)

  if (error) {
    console.error('Error updating meal order:', error)
    return false
  }
  return true
}

