package com.d20companion.feedback

import android.content.Context
import android.media.AudioAttributes
import android.media.SoundPool
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import com.d20companion.R
import d20.engine.play.Cue

/** The app's sounds (CC0, from Openverse; credits in assets/licenses/sounds.txt). [volume] keeps them discreet. */
enum class Sfx(val res: Int, val volume: Float) {
    TAP(R.raw.sfx_tap, 0.45f),
    SUCCESS(R.raw.sfx_success, 0.6f),
    CRITICAL(R.raw.sfx_critical, 0.7f),
    FAILURE(R.raw.sfx_failure, 0.55f),
    CRITICAL_FAILURE(R.raw.sfx_critical_failure, 0.6f),
}

fun Cue.sfx(): Sfx = when (this) {
    Cue.SUCCESS -> Sfx.SUCCESS
    Cue.CRITICAL -> Sfx.CRITICAL
    Cue.FAILURE -> Sfx.FAILURE
    Cue.CRITICAL_FAILURE -> Sfx.CRITICAL_FAILURE
}

/** Haptic + sound feedback (guide §6.1). Sounds are preloaded once into a SoundPool so they play without delay. */
object Feedback {
    const val HAPTIC_MS = 50L

    private var pool: SoundPool? = null
    private val ids = mutableMapOf<Sfx, Int>()

    /** Loads every sound; called once from the Application. */
    fun init(context: Context) {
        if (pool != null) return
        val attributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_GAME)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        val p = SoundPool.Builder().setMaxStreams(3).setAudioAttributes(attributes).build()
        Sfx.entries.forEach { ids[it] = p.load(context, it.res, 1) }
        pool = p
    }

    fun play(sfx: Sfx) {
        runCatching {
            val id = ids[sfx] ?: return
            pool?.play(id, sfx.volume, sfx.volume, 1, 0, 1f)
        }
    }

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
}
