import { FastifyRequest, FastifyReply } from 'fastify'
import { knex } from '../database'

export async function authUser(request: FastifyRequest, reply: FastifyReply) {
  try {
    // verificar se o usuário está autenticado
    const { sessionId } = request.cookies
    const { userID } = request.cookies

    if (!sessionId) {
      return reply.status(409).send('You must be logged in')
    }

    const userExist = await knex('users').where('id', userID).first()

    if (!userExist) {
      return reply.status(409).send('You must be logged in')
    }
  } catch (error) {
    console.error(error)
    return reply.status(500).send({ message: 'Erro interno do servidor' })
  }
}
