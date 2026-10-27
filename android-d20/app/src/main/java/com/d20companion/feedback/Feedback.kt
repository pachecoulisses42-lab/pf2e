package com.d20companion.feedback

import android.content.Context
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

/** Haptic + sound feedback fired the instant a station is tapped (guide §6.1). */
object Feedback {
    const val HAPTIC_MS = 50L

    @Suppress("DEPRECATION")
    fun haptic(context: Context) {
        runCatching {
            val vibrator: Vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                (context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
            } else {
                context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            }
            vibrator.vibrate(VibrationEffect.createOneShot(HAPTIC_MS, VibrationEffect.DEFAULT_AMPLITUDE))
        }
    }

    /** Short synthesized tick (no audio asset needed); a recorded dice rattle can replace it later. */
    fun sound() {
        runCatching {
            val tone = ToneGenerator(AudioManager.STREAM_MUSIC, 60)
            tone.startTone(ToneGenerator.TONE_PROP_BEEP, 60)
            android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({ tone.release() }, 200)
        }
    }
}
