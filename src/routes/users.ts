import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'node:crypto'

interface MealsCountResult {
  mealsCount: number
  mealsOnDietCount: number
  mealsOffDietCount: number
  bestSequenceDays: number
}

export async function usersRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const users = await knex('users').select('*')

    return { users }
  })
  app.get('/:id', async (request, reply) => {
    const getUsersParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getUsersParamsSchema.parse(request.params)

    const user = await knex('users').where('id', id).first()

    return { user }
  })
  app.get('/metrics/:id', async (request, reply) => {
    const getUsersParamsSchema = z.object({
      id: z.string().uuid(),
    })
    const { id } = getUsersParamsSchema.parse(request.params)

    const AllMeals = await knex('meals')
      .select('*')
      .where('user_id', id)
      .orderBy('dateTime')

    let bestSequenceDays = 2
    let countSequenceDays = 0

    const numberOfMeals = AllMeals.length
    let mealsOnDiet = 0
    let mealsOffDiet = 0
    let previousDate = null
    let contou = null

    for (let index = 0; index < AllMeals.length; index++) {
      const element = AllMeals[index]
      const currentDate = new Date(element.dateTime).toISOString().split('T')[0]
      if (element.on_diete) {
        contou = false
        mealsOnDiet++

        if (currentDate !== previousDate) {
          console.log(currentDate)

          countSequenceDays++
          contou = true
        }
      } else {
        console.log('-- deu ruim')
        mealsOffDiet++

        if (contou) {
          console.log('contou')

          countSequenceDays--
          bestSequenceDays = countSequenceDays
        }
        if (bestSequenceDays < countSequenceDays) {
          bestSequenceDays = countSequenceDays
        }
        countSequenceDays = 0
      }
      previousDate = currentDate
    }
    if (bestSequenceDays < countSequenceDays) {
      bestSequenceDays = countSequenceDays
    }

    const metrics = {
      numberOfMeals,
      mealsOnDiet,
      mealsOffDiet,
      bestSequenceDays,
    }

    return { metrics }
  })

  app.post('/', async (request, reply) => {
    const createUserBodyschema = z.object({
      name: z.string(),
    })

    const { name } = createUserBodyschema.parse(request.body)

    const userID = randomUUID()
    const sessionId = randomUUID()

    const cookieOptions = {
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
    }

    reply
      .cookie('sessionId', sessionId, { ...cookieOptions })
      .cookie('userID', userID, { ...cookieOptions })

    await knex('users').insert({
      id: userID,
      name,
    })

    return reply.status(201).send()
  })
}
