export default defineEventHandler((event) => listFarms(requireUser(event).user.id))
