'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function deleteInstapayEntry(entryId: string, imagePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[v0] Deleting instapay entry:', { entryId, imagePath })
    
    // First, delete the image from Supabase Storage
    const { error: storageError } = await supabase.storage.from('Instapay').remove([imagePath])

    if (storageError) {
      console.error('[v0] Error deleting image from storage:', storageError)
      return { success: false, error: 'Failed to delete image' }
    }

    console.log('[v0] Image deleted successfully')

    // Then, delete the database entry
    const { error: dbError } = await supabase
      .from('instapay_entries')
      .delete()
      .eq('id', entryId)

    if (dbError) {
      console.error('[v0] Error deleting instapay entry from database:', dbError)
      return { success: false, error: 'Failed to delete donation record' }
    }

    console.log('[v0] Database entry deleted successfully')
    return { success: true }
  } catch (error) {
    console.error('[v0] Error in deleteInstapayEntry:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
