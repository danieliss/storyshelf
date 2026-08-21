import { supabase } from './supabaseClient'

export async function uploadCapaPersonalizada(bookId: string, file: File) {
  const extensao = file.name.split('.').pop()
  const caminho = `${bookId}.${extensao}`

  const { error: uploadError } = await supabase.storage
    .from('covers')
    .upload(caminho, file, { upsert: true })

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase.storage.from('covers').getPublicUrl(caminho)

  const { error: updateError } = await supabase
    .from('books')
    .update({ cover_url: data.publicUrl })
    .eq('id', bookId)

  if (updateError) {
    throw updateError
  }

  return data.publicUrl
}