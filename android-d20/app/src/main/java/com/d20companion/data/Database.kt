package com.d20companion.data

import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.RoomDatabase
import androidx.room.Upsert
import kotlinx.coroutines.flow.Flow

/** One row per character: the validated dashboard JSON plus the mutable play-state (current HP). */
@Entity(tableName = "characters")
data class CharacterEntity(
    @PrimaryKey val id: String,
    val name: String,
    val characterClass: String,
    val dashboardJson: String,
    val currentHp: Int,
    val updatedAt: Long,
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

@Database(entities = [CharacterEntity::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun characters(): CharacterDao
}
