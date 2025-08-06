import { logger } from "../config/winston.js"

export function tryCatch(controller) {
    return async (req, res, next) => {
      try {
        await controller(req, res, next)
      } catch (error) {
        logger.error('Error', error)
        next(error)
      }
    }
  }
  