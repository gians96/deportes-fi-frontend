import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()

  if (!auth.token) {
    auth.loadFromStorage()
  }

  if (auth.token && !auth.user) {
    await auth.fetchProfile()
  }

  if (!auth.isLoggedIn) {
    return navigateTo('/login')
  }

  const refereeAllowed = auth.isReferee && to.path.startsWith('/admin/disciplinas')

  // El tesorero solo ve el panel y las pantallas donde se validan pagos.
  const treasuryAllowed =
    auth.isTreasurer &&
    ['/admin/dashboard', '/admin/inscripciones', '/admin/grupos', '/admin/vouchers'].some(
      (path) => to.path === path || to.path.startsWith(`${path}/`),
    )

  if (!auth.isAdmin && !refereeAllowed && !treasuryAllowed) {
    return navigateTo('/403')
  }
})
