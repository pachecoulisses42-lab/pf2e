package com.d20companion.ui

/** Destinations of the "⋮" menu. "Painel" and "Condições" act on the character opened last. */
class NavActions(
    val toHome: () -> Unit,
    val toList: () -> Unit,
    val toPanel: () -> Unit,
    val toConditions: () -> Unit,
    val toSettings: () -> Unit,
)
