pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "d20-companion"

include(":engine")
// `-PengineOnly=true` builds/tests only the pure-Kotlin rules engine (no Android SDK needed).
if (providers.gradleProperty("engineOnly").orNull != "true") {
    include(":app")
}
