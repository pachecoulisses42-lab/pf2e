package com.d20companion

import android.app.Application
import androidx.room.Room
import com.d20companion.data.AppDatabase
import com.d20companion.data.CharacterRepository
import com.d20companion.data.MIGRATION_1_2
import com.d20companion.data.Prefs

/** Manual dependency container (no DI framework needed for one repository). */
class AppContainer(application: Application) {
    private val database = Room.databaseBuilder(application, AppDatabase::class.java, "d20-companion.db")
        .addMigrations(MIGRATION_1_2)
        .build()
    val repository = CharacterRepository(database.characters())
    val prefs = Prefs(application)
}

class D20Application : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
