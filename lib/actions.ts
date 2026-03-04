import { supabase } from '@/lib/supabaseClient'

export async function deleteInstapayEntry(
  entryId: string,
  imagePath: string
): Promise<{ success: boolean; error?: string }> {
  console.log('[delete] start', { entryId, imagePath })
  
  try {
    // First, delete the image from Supabase Storage
    const { error: storageError } = await supabase.storage.from('Instapay').remove([imagePath])

    if (storageError) {
      console.error('[delete] storage error:', storageError.message)
      return { success: false, error: storageError.message }
    }

    // Then, delete the database entry
    const { error: dbError } = await supabase
      .from('instapay_entries')
      .delete()
      .eq('id', entryId)

    if (dbError) {
      console.error('[delete] db error:', dbError.message)
      return { success: false, error: dbError.message }
    }

    console.log('[delete] success')
    return { success: true }
  } catch (error) {
    console.error('[delete] exception:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
