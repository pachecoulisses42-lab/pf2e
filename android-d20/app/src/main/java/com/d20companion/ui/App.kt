package com.d20companion.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.d20companion.AppContainer
import com.d20companion.vm.ListViewModel
import com.d20companion.vm.SheetViewModel

@Composable
fun D20App(container: AppContainer) {
    val prefs = container.prefs
    var themeMode by remember { mutableIntStateOf(prefs.themeMode) }
    var soundOn by remember { mutableStateOf(prefs.soundOn) }
    val dark = when (themeMode) { 1 -> false; 2 -> true; else -> isSystemInDarkTheme() }

    D20Theme(darkTheme = dark) {
        val controller = rememberNavController()
        // Starts on the home screen. "Painel" and "Condições" act on the character opened last; without one they open the list.
        fun toSheet(conditions: Boolean) {
            val id = prefs.lastCharacterId ?: return controller.navigate("list") { popUpTo("home"); launchSingleTop = true }
            controller.navigate("sheet/$id?conditions=$conditions") { launchSingleTop = true }
        }
        val nav = NavActions(
            toHome = { controller.navigate("home") { popUpTo("home") { inclusive = true }; launchSingleTop = true } },
            toList = { controller.navigate("list") { popUpTo("home"); launchSingleTop = true } },
            toPanel = { toSheet(false) },
            toConditions = { toSheet(true) },
            toSettings = { controller.navigate("settings") { launchSingleTop = true } },
        )
        val open: (String) -> Unit = { id -> prefs.lastCharacterId = id; controller.navigate("sheet/$id?conditions=false") }
        NavHost(navController = controller, startDestination = "home") {
            composable("home") {
                val vm: ListViewModel = viewModel(factory = ListViewModel.factory(container))
                val characters by vm.characters.collectAsStateWithLifecycle()
                HomeScreen(vm, characters, characters.firstOrNull { it.id == prefs.lastCharacterId }, nav, open)
            }
            composable("list") {
                val vm: ListViewModel = viewModel(factory = ListViewModel.factory(container))
                val characters by vm.characters.collectAsStateWithLifecycle()
                ListScreen(vm, characters, nav, onOpen = open)
            }
            composable(
                "sheet/{id}?conditions={conditions}",
                arguments = listOf(
                    navArgument("id") { type = NavType.StringType },
                    navArgument("conditions") { type = NavType.BoolType; defaultValue = false },
                ),
            ) { entry ->
                val id = checkNotNull(entry.arguments?.getString("id"))
                val openConditions = entry.arguments?.getBoolean("conditions") ?: false
                val vm: SheetViewModel = viewModel(key = id, factory = SheetViewModel.factory(id, container))
                val state by vm.state.collectAsStateWithLifecycle()
                SheetScreen(vm, state, soundOn, nav, openConditions)
            }
            composable("settings") {
                SettingsScreen(
                    themeMode, soundOn,
                    onTheme = { themeMode = it; prefs.themeMode = it },
                    onSound = { soundOn = it; prefs.soundOn = it },
                    nav = nav,
                )
            }
        }
    }
}
