package com.d20companion.ui

/** The four bottom-bar destinations. "Painel" and "Condições" act on the character opened last. */
class NavActions(
    val toList: () -> Unit,
    val toPanel: () -> Unit,
    val toConditions: () -> Unit,
    val toSettings: () -> Unit,
)
