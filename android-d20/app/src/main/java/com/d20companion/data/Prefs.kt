package com.d20companion.data

import android.content.Context

/** Small app preferences: theme, sound and the character last opened. */
class Prefs(context: Context) {
    private val sp = context.getSharedPreferences("d20-companion", Context.MODE_PRIVATE)

    /** 0 = follow the system, 1 = light, 2 = dark. */
    var themeMode: Int
        get() = sp.getInt("theme", 0)
        set(v) = sp.edit().putInt("theme", v).apply()

    var soundOn: Boolean
        get() = sp.getBoolean("sound", true)
        set(v) = sp.edit().putBoolean("sound", v).apply()

    var lastCharacterId: String?
        get() = sp.getString("last", null)
        set(v) = sp.edit().putString("last", v).apply()
}
