import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'node:crypto'
import { authUser } from '../middleware/authUser'

export async function mealsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authUser)

  app.get('/', async (request, reply) => {
    const userID = request.cookies.userID

    const meals = await knex('meals').where('user_id', userID).select('*')

    return { meals }
  })

  app.get('/:id', async (request, reply) => {
    const getMealsParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealsParamsSchema.parse(request.params)

    const user = await knex('meals').where('id', id).first()

    return { user }
  })

  app.post('/', async (request, reply) => {
    const createUserBodyschema = z.object({
      name: z.string(),
      description: z.string(),
      dateTime: z.string().datetime(),
      on_diete: z.boolean(),
    })

    const { name, description, dateTime, on_diete } =
      createUserBodyschema.parse(request.body)

    const userID = request.cookies.userID

    await knex('meals').insert({
      id: randomUUID(),
      user_id: userID,
      name,
      description,
      dateTime,
      on_diete,
    })

    return reply.status(201).send()
  })

  app.put('/:id', async (request, reply) => {
    const getMealsParamsSchema = z.object({
      id: z.string().uuid(),
    })
    const createUserBodyschema = z.object({
      name: z.optional(z.string()),
      description: z.optional(z.string()),
      dateTime: z.optional(z.string().datetime()),

      on_diete: z.optional(z.boolean()),
    })

    const { id } = getMealsParamsSchema.parse(request.params)
    const { name, dateTime, description, on_diete } =
      createUserBodyschema.parse(request.body)

    const meal = await knex('meals').where('id', id).first()

    if (!meal) {
      return reply.status(404).send('Meals not found')
    }

    await knex('meals')
      .where('id', id)
      .update({ name, dateTime, description, on_diete })

    return reply.status(204).send()
  })

  app.delete('/:id', async (request, reply) => {
    const getMealsParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealsParamsSchema.parse(request.params)

    await knex('meals').where('id', id).first().del()

    return reply.status(204).send()
  })
}
