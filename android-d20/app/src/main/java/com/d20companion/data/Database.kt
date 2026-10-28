package com.d20companion.data

import androidx.room.ColumnInfo
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.RoomDatabase
import androidx.room.Upsert
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.flow.Flow

/**
 * One row per character: the validated dashboard JSON plus the mutable play state. [playStateJson] holds HP,
 * shield, conditions, persistent damage, afflictions and item uses; [currentHp] is kept in sync for old rows.
 */
@Entity(tableName = "characters")
data class CharacterEntity(
    @PrimaryKey val id: String,
    val name: String,
    val characterClass: String,
    val dashboardJson: String,
    val currentHp: Int,
    val updatedAt: Long,
    @ColumnInfo(defaultValue = "") val playStateJson: String = "",
)

@Dao
interface CharacterDao {
    @Query("SELECT * FROM characters ORDER BY updatedAt DESC")
    fun observeAll(): Flow<List<CharacterEntity>>

    @Query("SELECT * FROM characters WHERE id = :id")
    suspend fun find(id: String): CharacterEntity?

    @Upsert
    suspend fun upsert(entity: CharacterEntity)

    @Query("DELETE FROM characters WHERE id = :id")
    suspend fun delete(id: String)
}

@Database(entities = [CharacterEntity::class], version = 2, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun characters(): CharacterDao
}

/** v1 → v2: adds the play state column; old rows keep their HP through the empty default. */
val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("ALTER TABLE characters ADD COLUMN playStateJson TEXT NOT NULL DEFAULT ''")
    }
}
