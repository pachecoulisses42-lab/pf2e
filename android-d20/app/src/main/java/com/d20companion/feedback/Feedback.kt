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

/** How a sound is felt: nothing, the system's light "tick", or a curve that follows the sound's loudness. */
sealed interface Haptic {
    data object None : Haptic
    data object Tick : Haptic
    /** One amplitude (0..255) every [stepMs], taken from the sound's own volume envelope. */
    class Envelope(val stepMs: Long, val amplitudes: IntArray) : Haptic
}

/**
 * The app's sounds (CC0, from Openverse; credits in assets/licenses/sounds.txt). [volume] keeps them discreet.
 * Only the tap and the two criticals vibrate: a gentle tick, and the criticals shaken to their own sound.
 */
enum class Sfx(val res: Int, val volume: Float, val haptic: Haptic) {
    TAP(R.raw.sfx_tap, 0.45f, Haptic.Tick),
    SUCCESS(R.raw.sfx_success, 0.6f, Haptic.None),
    CRITICAL(
        R.raw.sfx_critical, 0.7f,
        Haptic.Envelope(40, intArrayOf(103, 86, 89, 113, 133, 120, 66, 176, 208, 255, 190, 170, 144, 168, 167, 86, 74, 73, 72, 71, 35)),
    ),
    FAILURE(R.raw.sfx_failure, 0.55f, Haptic.None),
    CRITICAL_FAILURE(
        R.raw.sfx_critical_failure, 0.6f,
        Haptic.Envelope(40, intArrayOf(226, 182, 168, 163, 94, 87, 178, 255, 219, 191, 110, 42, 49, 44)),
    ),
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
            val effect = when (val h = sfx.haptic) {
                Haptic.None -> return@runCatching
                Haptic.Tick -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    VibrationEffect.createPredefined(VibrationEffect.EFFECT_TICK)
                } else {
                    VibrationEffect.createOneShot(8, if (v.hasAmplitudeControl()) 60 else VibrationEffect.DEFAULT_AMPLITUDE)
                }
                is Haptic.Envelope -> {
                    // Phones without amplitude control keep the rhythm: on where the sound is loud, off elsewhere.
                    val amps = if (v.hasAmplitudeControl()) h.amplitudes else IntArray(h.amplitudes.size) { if (h.amplitudes[it] >= 128) 255 else 0 }
                    VibrationEffect.createWaveform(LongArray(amps.size) { h.stepMs }, amps, -1)
                }
            }
            v.vibrate(effect)
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
