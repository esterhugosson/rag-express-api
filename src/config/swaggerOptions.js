import swaggerJSDoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import dotenv from 'dotenv'
dotenv.config()
import path from 'path'

const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Movie api design',
        version: '1.0.0',
        description: 'An api for retrieving movies, actors and rating aswell as creating, updating and deleting you own movies.',
      },
      tags: [
        {
          name: 'Movies',
          description: 'The movies managing API',
        },
        {
          name: 'Ratings',
          description: 'The ratings managing API',
        },
        {
          name: 'Actors',
          description: 'The actors managing API',
        },
        {
            name: 'Auth',
            description: 'The Auth managing API',
          },
      ],
      servers: [
        {
          url: `${process.env.SERVER_ADRESS}${process.env.PORT}${process.env.BASE_Url}api/v1/`, 
        },
      ],
    },
    apis: ['./src/routes/api/v1/*.js', './src/models/*.js'], 
}


const swaggerSpec = swaggerJSDoc(options)

export { swaggerUi, swaggerSpec }