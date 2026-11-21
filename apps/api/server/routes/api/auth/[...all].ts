import { getContainer } from '../../../utils/container'

export default defineEventHandler((event) => getContainer(useRuntimeConfig(event)).auth.handler(toWebRequest(event)))
