import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()

  if (!auth.token) {
    auth.loadFromStorage()
  }

  if (auth.token && !auth.user) {
    await auth.fetchProfile()
  }

  if (!auth.isLoggedIn) return

  if (auth.isAdmin || auth.isTreasurer || auth.isReferee) {
    return navigateTo(auth.homePath)
  }

  if (auth.needsProfile) {
    return navigateTo('/completar-perfil')
  }

  const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : '/'
  return navigateTo(redirect && redirect !== '/login' ? redirect : '/')
})
