package com.d20companion.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
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
    D20Theme {
        val nav = rememberNavController()
        NavHost(navController = nav, startDestination = "list") {
            composable("list") {
                val vm: ListViewModel = viewModel(factory = ListViewModel.factory(container))
                val characters by vm.characters.collectAsStateWithLifecycle()
                ListScreen(vm, characters, onOpen = { id -> nav.navigate("sheet/$id") })
            }
            composable("sheet/{id}", arguments = listOf(navArgument("id") { type = NavType.StringType })) { entry ->
                val id = checkNotNull(entry.arguments?.getString("id"))
                val vm: SheetViewModel = viewModel(factory = SheetViewModel.factory(id, container))
                val state by vm.state.collectAsStateWithLifecycle()
                SheetScreen(vm, state, onBack = { nav.popBackStack() })
            }
        }
    }
}
