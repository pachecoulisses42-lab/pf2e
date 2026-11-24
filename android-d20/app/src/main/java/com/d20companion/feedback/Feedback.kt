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

/**
 * The app's sounds (CC0, from Openverse; credits in assets/licenses/sounds.txt). [volume] keeps them discreet.
 * Each has a vibration that follows it: [timings] in ms (off/on alternating, starting with a pause) and
 * [amplitudes] 0..255, shaped like the sound (a tick, two pulses, a rising burst, one dull buzz).
 */
enum class Sfx(val res: Int, val volume: Float, val timings: LongArray, val amplitudes: IntArray) {
    TAP(R.raw.sfx_tap, 0.45f, longArrayOf(0, 12), intArrayOf(0, 70)),
    SUCCESS(R.raw.sfx_success, 0.6f, longArrayOf(0, 25, 70, 25), intArrayOf(0, 120, 0, 120)),
    CRITICAL(R.raw.sfx_critical, 0.7f, longArrayOf(0, 30, 50, 30, 50, 90), intArrayOf(0, 140, 0, 190, 0, 255)),
    FAILURE(R.raw.sfx_failure, 0.55f, longArrayOf(0, 110), intArrayOf(0, 90)),
    CRITICAL_FAILURE(R.raw.sfx_critical_failure, 0.6f, longArrayOf(0, 70, 60, 160), intArrayOf(0, 120, 0, 200)),
}

fun Cue.sfx(): Sfx = when (this) {
    Cue.SUCCESS -> Sfx.SUCCESS
    Cue.CRITICAL -> Sfx.CRITICAL
    Cue.FAILURE -> Sfx.FAILURE
    Cue.CRITICAL_FAILURE -> Sfx.CRITICAL_FAILURE
}

/** Sound + vibration feedback (guide §6.1). Sounds are preloaded once into a SoundPool so they play without delay. */
object Feedback {
    private var pool: SoundPool? = null
    private var vibrator: Vibrator? = null
    private val ids = mutableMapOf<Sfx, Int>()

    /** Ajustes → "Vibração"; kept here so every caller follows it. */
    var vibrationOn: Boolean = true

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
        vibrator = vibratorOf(context)
    }

    /** Plays [sfx] (when [sound] is on) and its vibration (when [vibrationOn]) at the same moment. */
    fun play(sfx: Sfx, sound: Boolean) {
        if (sound) runCatching {
            val id = ids[sfx] ?: return@runCatching
            pool?.play(id, sfx.volume, sfx.volume, 1, 0, 1f)
        }
        if (vibrationOn) vibrate(sfx)
    }

    private fun vibrate(sfx: Sfx) {
        runCatching {
            val v = vibrator?.takeIf { it.hasVibrator() } ?: return@runCatching
            // Phones without amplitude control get the same rhythm at full strength.
            val amplitudes = if (v.hasAmplitudeControl()) sfx.amplitudes else IntArray(sfx.amplitudes.size) { if (it % 2 == 1) 255 else 0 }
            v.vibrate(VibrationEffect.createWaveform(sfx.timings, amplitudes, -1))
        }
    }

    @Suppress("DEPRECATION")
    private fun vibratorOf(context: Context): Vibrator? = runCatching {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
        } else {
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
    }.getOrNull()
}
