import { supabase } from '@/lib/supabaseClient'

export async function deleteInstapayEntry(
  entryId: string,
  imagePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[v0] Starting deleteInstapayEntry', { entryId, imagePath })

    // First, delete the image from Supabase Storage
    console.log('[v0] Deleting image from storage:', imagePath)
    const { error: storageError } = await supabase.storage.from('Instapay').remove([imagePath])

    if (storageError) {
      console.error('[v0] Storage deletion failed:', storageError.message)
      return { success: false, error: storageError.message }
    }

    console.log('[v0] Image deleted successfully from storage')

    // Then, delete the database entry
    console.log('[v0] Deleting database entry:', entryId)
    const { error: dbError } = await supabase
      .from('instapay_entries')
      .delete()
      .eq('id', entryId)

    if (dbError) {
      console.error('[v0] Database deletion failed:', dbError.message)
      return { success: false, error: dbError.message }
    }

    console.log('[v0] Database entry deleted successfully')
    return { success: true }
  } catch (error) {
    console.error('[v0] Error in deleteInstapayEntry:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
