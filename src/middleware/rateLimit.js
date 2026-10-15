import rateLimit from 'express-rate-limit'

const base = { standardHeaders: 'draft-7', legacyHeaders: false }

// Applies to every route
export const generalLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 200,
  message: { message: 'Too many requests, please slow down.' },
})

// Applies only to the LLM endpoint (the one that costs money)
export const ragLimiter = rateLimit({
  ...base,
  windowMs: 10 * 60 * 1000,
  limit: 5,
  message: {
    message: 'Demo limit reached: 5 questions per 10 minutes per visitor. Please try again shortly.',
  },
})