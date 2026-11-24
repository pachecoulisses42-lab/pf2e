package com.d20companion.data

import android.content.Context
import android.net.Uri
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.text.PDFTextStripper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/** Reads a picked file as text: PDFs through PDFBox (on the device, no network), anything else as UTF-8. */
class ImportReader(private val context: Context) {
    suspend fun readText(uri: Uri): String = withContext(Dispatchers.IO) {
        val resolver = context.contentResolver
        val isPdf = resolver.getType(uri)?.contains("pdf") == true || uri.toString().lowercase().endsWith(".pdf")
        val stream = checkNotNull(resolver.openInputStream(uri)) { "Não foi possível abrir o arquivo" }
        stream.use { input ->
            if (isPdf) PDDocument.load(input).use { PDFTextStripper().getText(it) } else input.readBytes().toString(Charsets.UTF_8)
        }
    }
}
